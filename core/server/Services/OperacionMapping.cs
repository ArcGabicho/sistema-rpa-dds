using System.Globalization;
using Server.Dtos;
using Server.Models;

namespace Server.Services;

// Responses shared by the bots, incidents and expirations APIs.
public static class OperacionMapping
{
    // How early a contract shows as about to expire: time to negotiate the
    // renewal. Licenses and credentials warn a month ahead, like the vault.
    public const int DiasAvisoContrato = 60;
    public const int DiasAvisoLicencia = 30;

    public static (string Estado, int Dias) Vencimiento(DateTime venceEl, DateTime hoy, int diasAviso)
    {
        var dias = (venceEl.Date - hoy.Date).Days;
        return (dias < 0 ? "vencido" : dias <= diasAviso ? "por_vencer" : "vigente", dias);
    }

    public static T LlenarIncidencia<T>(T r, Incidencia i, DateTime ahoraUtc) where T : IncidenciaListItem
    {
        var sla = Sla.Evaluar(i, ahoraUtc);
        r.Id = i.Id;
        r.Codigo = i.Codigo;
        r.Titulo = i.Titulo;
        r.EmpresaId = i.EmpresaId;
        r.EmpresaNombre = i.Empresa?.NombreComercial ?? "—";
        r.BotId = i.BotId;
        r.BotNombre = i.Bot?.Nombre;
        r.Severidad = i.Severidad;
        r.Estado = i.Estado;
        r.Causa = i.Causa;
        r.ResponsableNombre = i.Responsable?.FullName;
        r.CreatedAtUtc = i.CreatedAtUtc;
        r.ResueltaAtUtc = i.ResueltaAtUtc;
        r.Sla = new SlaResponse
        {
            ObjetivoRespuestaHoras = sla.ObjetivoRespuestaHoras,
            ObjetivoResolucionHoras = sla.ObjetivoResolucionHoras,
            VenceRespuestaUtc = sla.VenceRespuestaUtc,
            VenceResolucionUtc = sla.VenceResolucionUtc,
            RespuestaCumplida = sla.RespuestaCumplida,
            ResolucionCumplida = sla.ResolucionCumplida,
            Semaforo = sla.Semaforo,
        };
        return r;
    }

    public static LicenciaResponse ToLicencia(Licencia l, DateTime hoy)
    {
        var (estado, dias) = Vencimiento(l.VenceEl, hoy, DiasAvisoLicencia);
        return new LicenciaResponse
        {
            Id = l.Id,
            EmpresaId = l.EmpresaId,
            EmpresaNombre = l.Empresa?.NombreComercial,
            BotId = l.BotId,
            BotNombre = l.Bot?.Nombre,
            Nombre = l.Nombre,
            Proveedor = l.Proveedor,
            Cantidad = l.Cantidad,
            CostoAnual = l.CostoAnual,
            Moneda = l.Moneda,
            PagaCliente = l.PagaCliente,
            VenceEl = l.VenceEl,
            Notas = l.Notas,
            Vencimiento = estado,
            Dias = dias,
        };
    }

    public static ContratoResponse ToContrato(ContratoSoporte c, DateTime hoy)
    {
        var (estado, dias) = Vencimiento(c.FechaFin, hoy, DiasAvisoContrato);
        return new ContratoResponse
        {
            Id = c.Id,
            EmpresaId = c.EmpresaId,
            EmpresaNombre = c.Empresa?.NombreComercial ?? "—",
            PropuestaId = c.PropuestaId,
            PropuestaNombre = c.Propuesta is null ? null : $"{c.Propuesta.Codigo} v{c.Propuesta.Version}",
            Nombre = c.Nombre,
            Estado = c.Estado,
            MontoMensual = c.MontoMensual,
            Moneda = c.Moneda,
            FechaInicio = c.FechaInicio,
            FechaFin = c.FechaFin,
            Notas = c.Notas,
            OportunidadRenovacionId = c.OportunidadRenovacionId,
            OportunidadRenovacionTitulo = c.OportunidadRenovacion?.Titulo,
            OportunidadRenovacionEtapa = c.OportunidadRenovacion?.Etapa,
            Vencimiento = c.Estado == ContratoEstado.Terminado ? ContratoEstado.Terminado : estado,
            Dias = dias,
        };
    }

    public static string Monto(string moneda, decimal valor) =>
        $"{(moneda == Moneda.Dolares ? "US$" : "S/")} {valor.ToString("N0", CultureInfo.InvariantCulture)}";
}
