using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(CancellationToken ct)
    {
        var clientsTotal = await db.Clients.CountAsync(ct);
        var clientsNew = await db.Clients.CountAsync(c => c.Status == ClientStatus.Nuevo, ct);

        var recentClients = await db.Clients
            .OrderByDescending(c => c.CreatedAtUtc)
            .Take(5)
            .Select(c => new RecentClientSummary
            {
                Id = c.Id,
                FullName = c.FullName,
                Status = c.Status,
                CreatedAtUtc = c.CreatedAtUtc,
            })
            .ToListAsync(ct);

        var abiertas = db.Oportunidades.Where(o => OportunidadEtapa.Abiertas.Contains(o.Etapa));
        var porEtapa = await abiertas
            .GroupBy(o => o.Etapa)
            .Select(g => new { Etapa = g.Key, Cantidad = g.Count(), Valor = g.Sum(o => o.ValorEstimado ?? 0) })
            .ToListAsync(ct);
        // Every open stage, in pipeline order, even when it's empty.
        var embudo = OportunidadEtapa.Abiertas
            .Select(etapa => porEtapa.FirstOrDefault(x => x.Etapa == etapa) is { } x
                ? new EtapaResumen { Etapa = etapa, Cantidad = x.Cantidad, Valor = x.Valor }
                : new EtapaResumen { Etapa = etapa, Cantidad = 0, Valor = 0 })
            .ToList();

        var hoy = Lima.Hoy;
        var accionesVencidas = await abiertas.CountAsync(o => o.ProximaAccionFecha != null && o.ProximaAccionFecha < hoy, ct);
        var proximasAcciones = await abiertas
            .Where(o => o.ProximaAccion != null && o.ProximaAccionFecha != null)
            .OrderBy(o => o.ProximaAccionFecha)
            .Take(6)
            .Select(o => new ProximaAccionItem
            {
                OportunidadId = o.Id,
                Titulo = o.Titulo,
                EmpresaNombre = o.Empresa != null ? o.Empresa.NombreComercial : "—",
                ProximaAccion = o.ProximaAccion!,
                ProximaAccionFecha = o.ProximaAccionFecha!.Value,
                ResponsableNombre = o.Responsable != null ? o.Responsable.FullName : null,
            })
            .ToListAsync(ct);

        // Last six months, Lima calendar months, current one included.
        var primerMes = new DateTime(Lima.Hoy.Year, Lima.Hoy.Month, 1).AddMonths(-5);
        var desdeUtc = Lima.AUtc(primerMes);
        var recientes = await db.Oportunidades
            .Where(o => o.CreatedAtUtc >= desdeUtc || o.CerradaAtUtc >= desdeUtc)
            .Select(o => new { o.CreatedAtUtc, o.CerradaAtUtc, o.Etapa, o.ValorEstimado })
            .ToListAsync(ct);
        static string MesDe(DateTime utc) => Lima.DesdeUtc(utc).ToString("yyyy-MM", CultureInfo.InvariantCulture);
        var cerradas = recientes.Where(o => o.CerradaAtUtc >= desdeUtc).ToList();

        var mensual = Enumerable.Range(0, 6)
            .Select(i => primerMes.AddMonths(i).ToString("yyyy-MM", CultureInfo.InvariantCulture))
            .Select(mes =>
            {
                var ganadas = cerradas.Where(o => o.Etapa == OportunidadEtapa.Ganada && MesDe(o.CerradaAtUtc!.Value) == mes).ToList();
                return new MesResumen
                {
                    Mes = mes,
                    Creadas = recientes.Count(o => MesDe(o.CreatedAtUtc) == mes),
                    Ganadas = ganadas.Count,
                    Perdidas = cerradas.Count(o => o.Etapa == OportunidadEtapa.Perdida && MesDe(o.CerradaAtUtc!.Value) == mes),
                    ValorGanado = ganadas.Sum(o => o.ValorEstimado ?? 0),
                };
            })
            .ToList();
        var ganadasTotal = mensual.Sum(m => m.Ganadas);
        var cerradasTotal = ganadasTotal + mensual.Sum(m => m.Perdidas);

        var porServicioDb = await abiertas
            .GroupBy(o => o.Servicio)
            .Select(g => new { Servicio = g.Key, Cantidad = g.Count(), Valor = g.Sum(o => o.ValorEstimado ?? 0) })
            .ToListAsync(ct);
        var porServicio = ServicioTipo.All
            .Select(s => porServicioDb.FirstOrDefault(x => x.Servicio == s) is { } x
                ? new ServicioResumen { Servicio = s, Cantidad = x.Cantidad, Valor = x.Valor }
                : new ServicioResumen { Servicio = s, Cantidad = 0, Valor = 0 })
            .ToList();

        return Ok(new DashboardSummaryResponse
        {
            ClientsTotal = clientsTotal,
            ClientsNew = clientsNew,
            RecentClients = recentClients,
            EmpresasTotal = await db.Empresas.CountAsync(ct),
            EmpresasClientes = await db.Empresas.CountAsync(e => e.Estado == EmpresaEstado.Cliente, ct),
            OportunidadesAbiertas = embudo.Sum(e => e.Cantidad),
            ValorEmbudo = embudo.Sum(e => e.Valor),
            AccionesVencidas = accionesVencidas,
            Embudo = embudo,
            ProximasAcciones = proximasAcciones,
            Mensual = mensual,
            TasaCierre = cerradasTotal == 0 ? null : Math.Round((decimal)ganadasTotal / cerradasTotal, 3),
            PorServicio = porServicio,
        });
    }
}
