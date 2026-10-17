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
    [Modulo(Modulo.Comercial, NivelAcceso.Ver)]
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

    [HttpGet("entrega")]
    [Modulo(Modulo.Proyectos, NivelAcceso.Ver)]
    public async Task<ActionResult<EntregaResumenResponse>> GetEntrega(CancellationToken ct)
    {
        var hoy = Lima.Hoy;
        var activos = db.Proyectos.Where(p => p.Estado == ProyectoEstado.Planificado || p.Estado == ProyectoEstado.EnCurso || p.Estado == ProyectoEstado.EnPausa);
        var hitosAbiertos = db.Hitos.Where(h => h.Estado != HitoEstado.Completado && activos.Any(p => p.Id == h.ProyectoId));
        var tareasAbiertas = db.Tareas.Where(t => t.Estado != TareaEstado.Hecha && activos.Any(p => p.Id == t.ProyectoId));
        var procesosActivos = db.ProcesosProyecto.Where(x => activos.Any(p => p.Id == x.ProyectoId));

        var hitos = await hitosAbiertos
            .Where(h => h.FechaFin <= hoy.AddDays(14))
            .OrderBy(h => h.FechaFin)
            .Take(6)
            .Select(h => new HitoProximo
            {
                ProyectoId = h.ProyectoId,
                ProyectoNombre = h.Proyecto!.Nombre,
                EmpresaNombre = h.Proyecto.Empresa != null ? h.Proyecto.Empresa.NombreComercial : "—",
                Hito = h.Nombre,
                FechaFin = h.FechaFin,
                Atrasado = h.FechaFin < hoy,
            })
            .ToListAsync(ct);

        return Ok(new EntregaResumenResponse
        {
            ProyectosActivos = await activos.CountAsync(ct),
            ProyectosAtrasados = await activos.CountAsync(p => p.FechaFinPlan < hoy || hitosAbiertos.Any(h => h.ProyectoId == p.Id && h.FechaFin < hoy), ct),
            TareasBloqueadas = await tareasAbiertas.CountAsync(t => t.Estado == TareaEstado.Bloqueada, ct),
            TareasVencidas = await tareasAbiertas.CountAsync(t => t.FechaLimite < hoy, ct),
            PddEnRevision = await procesosActivos.CountAsync(x => x.PddEstado == PddEstado.EnRevision, ct),
            ProcesosSinBot = await procesosActivos.CountAsync(x => (x.Etapa == EtapaDesarrollo.Pruebas || x.Etapa == EtapaDesarrollo.Produccion)
                && !db.Bots.Any(b => b.ProcesoProyectoId == x.Id), ct),
            Hitos = hitos,
        });
    }

    // The signed-in user's own work: open tasks, follow-ups due this week
    // and open incidents, each only where they have access.
    [HttpGet("mi-trabajo")]
    public async Task<ActionResult<MiTrabajoResponse>> GetMiTrabajo(CancellationToken ct)
    {
        var p = HttpContext.Permisos();
        var yo = p.UsuarioId;
        var hoy = Lima.Hoy;
        var r = new MiTrabajoResponse();

        if (p.Puede(Modulo.Proyectos, NivelAcceso.Ver))
        {
            var mias = db.Tareas.Where(t => t.ResponsableId == yo && t.Estado != TareaEstado.Hecha
                && t.Proyecto!.Estado != ProyectoEstado.Completado && t.Proyecto.Estado != ProyectoEstado.Cancelado);
            r.TareasTotal = await mias.CountAsync(ct);
            r.Tareas = await mias
                .OrderBy(t => t.FechaLimite == null).ThenBy(t => t.FechaLimite).ThenBy(t => t.Orden)
                .Take(8)
                .Select(t => new MiTarea
                {
                    Id = t.Id,
                    Titulo = t.Titulo,
                    ProyectoId = t.ProyectoId,
                    ProyectoNombre = t.Proyecto!.Nombre,
                    Estado = t.Estado,
                    FechaLimite = t.FechaLimite,
                    Vencida = t.FechaLimite < hoy,
                    Bloqueo = t.Bloqueo,
                })
                .ToListAsync(ct);
        }

        if (p.Puede(Modulo.Comercial, NivelAcceso.Ver))
        {
            var semana = hoy.AddDays(7);
            var mias = db.Oportunidades.Where(o => o.ResponsableId == yo && OportunidadEtapa.Abiertas.Contains(o.Etapa)
                && o.ProximaAccion != null && o.ProximaAccionFecha != null && o.ProximaAccionFecha <= semana);
            r.AccionesTotal = await mias.CountAsync(ct);
            r.Acciones = await mias
                .OrderBy(o => o.ProximaAccionFecha)
                .Take(6)
                .Select(o => new ProximaAccionItem
                {
                    OportunidadId = o.Id,
                    Titulo = o.Titulo,
                    EmpresaNombre = o.Empresa != null ? o.Empresa.NombreComercial : "—",
                    ProximaAccion = o.ProximaAccion!,
                    ProximaAccionFecha = o.ProximaAccionFecha!.Value,
                    ResponsableNombre = null,
                })
                .ToListAsync(ct);
        }

        if (p.Puede(Modulo.Operacion, NivelAcceso.Ver))
        {
            var ahora = DateTime.UtcNow;
            var mias = await db.Incidencias.AsNoTracking()
                .Include(i => i.Empresa).Include(i => i.Bot).Include(i => i.Responsable)
                .Where(i => i.ResponsableId == yo && IncidenciaEstado.Abiertas.Contains(i.Estado))
                .ToListAsync(ct);
            r.IncidenciasTotal = mias.Count;
            r.Incidencias = mias
                .Select(i => OperacionMapping.LlenarIncidencia(new IncidenciaListItem(), i, ahora))
                .OrderBy(i => i.Sla!.Semaforo == Sla.Semaforo.Pausado)
                .ThenBy(i => i.Sla!.VenceResolucionUtc)
                .Take(6)
                .ToList();
        }

        return Ok(r);
    }
}
