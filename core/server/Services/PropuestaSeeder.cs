using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services;

// Demo proposals for local development (Seed:DatosDemo), built from the demo
// diagnoses and timed by each opportunity's own history: sent when it
// entered "propuesta", sometimes re-sent as a v2 with a discount during
// "negociación", accepted when won, rejected (with the loss reason) when
// lost after a proposal. The same notes the API writes go on the timeline,
// and the opportunity's value becomes what was quoted.
public static class PropuestaSeeder
{
    private const int Semilla = 20261019;

    public static async Task SeedAsync(AppDbContext db, IConfiguration config, ILogger logger, CancellationToken ct = default)
    {
        if (!config.GetValue<bool>("Seed:DatosDemo")) return;
        if (await db.Propuestas.AnyAsync(ct)) return;

        var autorId = await db.AdminUsers.OrderBy(u => u.Id).Select(u => (int?)u.Id).FirstOrDefaultAsync(ct);
        var diagnosticos = await db.Diagnosticos
            .Include(d => d.Procesos)
            .Include(d => d.Oportunidad)
            .Where(d => d.OportunidadId != null && d.Estado == DiagnosticoEstado.Entregado)
            .OrderBy(d => d.Id)
            .AsSplitQuery()
            .ToListAsync(ct);

        var ids = diagnosticos.Select(d => d.OportunidadId!.Value).ToList();
        var cambios = await db.Actividades
            .AsNoTracking()
            .Where(a => a.OportunidadId != null && ids.Contains(a.OportunidadId.Value) && a.Tipo == ActividadTipo.CambioEtapa)
            .Select(a => new { OportunidadId = a.OportunidadId!.Value, a.Descripcion, a.CreatedAtUtc })
            .ToListAsync(ct);
        DateTime? Momento(int oportunidadId, string sufijo) =>
            cambios.Where(c => c.OportunidadId == oportunidadId && c.Descripcion.Contains(sufijo)).Select(c => (DateTime?)c.CreatedAtUtc).FirstOrDefault();

        var rnd = new Random(Semilla);
        var ahora = DateTime.UtcNow;
        var correlativos = new Dictionary<int, int>();
        var propuestas = new List<Propuesta>();
        var notas = new List<Actividad>();

        foreach (var d in diagnosticos)
        {
            var o = d.Oportunidad!;
            // Only opportunities that actually reached the proposal stage.
            if (Momento(o.Id, "→ Propuesta.") is not { } enviadaEl) continue;

            var procesos = d.Procesos
                .Where(p => Roi.Calcular(p, d.CostoHora).Cuadrante is Roi.Cuadrante.QuickWin or Roi.Cuadrante.MejoraMenor or Roi.Cuadrante.Estrategico)
                .OrderBy(p => p.Orden)
                .ToList();
            if (procesos.Count == 0)
                procesos = d.Procesos.OrderByDescending(p => Roi.Calcular(p, d.CostoHora).AhorroAnual).Take(2).ToList();

            var anio = Lima.DesdeUtc(enviadaEl).Year;
            correlativos[anio] = correlativos.GetValueOrDefault(anio) + 1;
            var codigo = $"P-{anio}-{correlativos[anio]:0000}";

            Propuesta Version(int numero, DateTime enviada, decimal descuento)
            {
                var p = new Propuesta
                {
                    Codigo = codigo,
                    Version = numero,
                    EmpresaId = o.EmpresaId,
                    OportunidadId = o.Id,
                    Titulo = $"Automatización de procesos — {d.Titulo.Replace("Diagnóstico de procesos de ", "")}",
                    Estado = PropuestaEstado.Enviada,
                    Moneda = Moneda.Soles,
                    DescuentoPorcentaje = descuento,
                    ResponsableId = autorId,
                    EnviadaAtUtc = enviada,
                    ValidaHasta = Lima.DesdeUtc(enviada).Date.AddDays(PropuestaBorrador.DiasValidez),
                    CreatedAtUtc = enviada.AddHours(-rnd.Next(4, 72)),
                    UpdatedAtUtc = enviada,
                };
                PropuestaBorrador.DesdeDiagnostico(p, d, procesos);
                PropuestaBorrador.TextosBase(p);
                propuestas.Add(p);
                notas.Add(Nota(o, $"Propuesta {codigo} v{numero} enviada: {Resumen(p)} (más IGV).", autorId, enviada));
                return p;
            }

            var negociacion = Momento(o.Id, "→ Negociación.");
            var cierre = Momento(o.Id, "→ Ganada.") ?? Momento(o.Id, "→ Perdida.");
            // A second version, discounted, during the negotiation.
            var conV2 = negociacion is not null && rnd.NextDouble() < 0.45;

            var actual = Version(1, enviadaEl, 0);
            if (conV2)
            {
                var hasta = cierre ?? ahora;
                var reenvio = negociacion!.Value + (hasta - negociacion.Value) * (0.2 + rnd.NextDouble() * 0.5);
                actual.Estado = PropuestaEstado.Reemplazada;
                actual.UpdatedAtUtc = reenvio;
                actual = Version(2, reenvio, rnd.Next(1, 3) * 5);
            }

            if (o.Etapa == OportunidadEtapa.Ganada && cierre is { } ganada)
            {
                actual.Estado = PropuestaEstado.Aceptada;
                actual.RespondidaAtUtc = actual.UpdatedAtUtc = ganada.AddMinutes(-30);
                notas.Add(Nota(o, $"Propuesta {codigo} v{actual.Version} aceptada por el cliente.", autorId, ganada.AddMinutes(-30)));
            }
            else if (o.Etapa == OportunidadEtapa.Perdida && cierre is { } perdida)
            {
                actual.Estado = PropuestaEstado.Rechazada;
                actual.MotivoRechazo = o.MotivoPerdida ?? "No respondieron después de la propuesta.";
                actual.RespondidaAtUtc = actual.UpdatedAtUtc = perdida.AddMinutes(-30);
                notas.Add(Nota(o, $"Propuesta {codigo} v{actual.Version} rechazada. Motivo: {actual.MotivoRechazo}", autorId, perdida.AddMinutes(-30)));
            }

            o.ValorEstimado = PropuestaCalculo.Calcular(actual).ValorPrimerAnio;
        }

        db.Propuestas.AddRange(propuestas);
        db.Actividades.AddRange(notas);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Datos demo: {Propuestas} propuestas.", propuestas.Count);
    }

    private static string Resumen(Propuesta p)
    {
        var t = PropuestaCalculo.Calcular(p);
        var texto = $"S/ {t.BaseImplementacion.ToString("N0", CultureInfo.InvariantCulture)}";
        return t.BaseMensual > 0 ? $"{texto} + S/ {t.BaseMensual.ToString("N0", CultureInfo.InvariantCulture)} al mes" : texto;
    }

    private static Actividad Nota(Oportunidad o, string descripcion, int? autorId, DateTime cuando) => new()
    {
        EmpresaId = o.EmpresaId,
        OportunidadId = o.Id,
        Tipo = ActividadTipo.Nota,
        Descripcion = descripcion,
        AutorId = autorId,
        CreatedAtUtc = cuando,
    };
}
