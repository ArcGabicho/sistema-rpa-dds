using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services;

// Demo diagnoses for local development (Seed:DatosDemo): one for most
// opportunities that reached the "diagnóstico" stage or beyond — still in
// progress at that stage, delivered past it — each with a few processes
// drawn from typical candidates by area. It starts when the opportunity
// entered the stage and is delivered before it moved on, with the same notes
// on its timeline the API writes. Fixed seed; every figure is made up.
public static class DiagnosticoSeeder
{
    private const int Semilla = 20261018;

    // A candidate process: its area and service, monthly runs, minutes per
    // run, people, automatable share, and how feasible it tends to be (1–5).
    private sealed record Plantilla(
        string Area, string Nombre, string Servicio,
        (int, int) Ejecuciones, (int, int) Minutos, (int, int) Personas, (int, int) Automatizable, int Factibilidad);

    private static readonly Plantilla[] Plantillas =
    [
        new("Finanzas", "Conciliación bancaria diaria", ServicioTipo.Rpa, (22, 66), (30, 120), (1, 3), (70, 90), 5),
        new("Finanzas", "Registro de facturas de proveedores", ServicioTipo.Rpa, (300, 1500), (4, 10), (2, 4), (60, 85), 4),
        new("Finanzas", "Cobranza y envío de estados de cuenta", ServicioTipo.Rpa, (200, 800), (5, 12), (1, 3), (70, 90), 4),
        new("Finanzas", "Cierre contable mensual", ServicioTipo.Rpa, (1, 4), (600, 1800), (2, 5), (30, 50), 2),
        new("Recursos Humanos", "Altas y bajas en planilla", ServicioTipo.Rpa, (20, 150), (20, 45), (1, 2), (70, 90), 4),
        new("Recursos Humanos", "Atención de consultas de colaboradores", ServicioTipo.Ia, (300, 1200), (5, 10), (2, 4), (50, 70), 3),
        new("Logística", "Registro de guías de remisión", ServicioTipo.Rpa, (400, 2000), (3, 6), (2, 4), (75, 90), 5),
        new("Logística", "Seguimiento de pedidos a clientes", ServicioTipo.Ia, (500, 2500), (3, 8), (2, 5), (50, 75), 3),
        new("Logística", "Actualización de inventario en el ERP", ServicioTipo.Rpa, (30, 120), (20, 60), (1, 3), (60, 85), 3),
        new("Comercial", "Carga de órdenes de compra", ServicioTipo.Rpa, (200, 900), (6, 15), (1, 3), (70, 90), 4),
        new("Comercial", "Reporte semanal de ventas", ServicioTipo.Analitica, (4, 8), (180, 480), (1, 2), (70, 90), 4),
        new("Atención al cliente", "Clasificación de correos entrantes", ServicioTipo.Ia, (1500, 6000), (1, 3), (2, 4), (60, 80), 3),
        new("Atención al cliente", "Respuestas a consultas frecuentes", ServicioTipo.Ia, (800, 3000), (3, 6), (2, 5), (40, 65), 2),
        new("Tributario", "Descarga de comprobantes de SUNAT", ServicioTipo.Rpa, (20, 60), (30, 90), (1, 2), (85, 95), 5),
        new("Tributario", "Reportes regulatorios", ServicioTipo.Analitica, (2, 8), (240, 720), (1, 3), (50, 75), 3),
    ];


    public static async Task SeedAsync(AppDbContext db, IConfiguration config, ILogger logger, CancellationToken ct = default)
    {
        if (!config.GetValue<bool>("Seed:DatosDemo")) return;
        if (await db.Diagnosticos.AnyAsync(ct)) return;

        var autorId = await db.AdminUsers.OrderBy(u => u.Id).Select(u => (int?)u.Id).FirstOrDefaultAsync(ct);
        string[] etapas = [OportunidadEtapa.Diagnostico, OportunidadEtapa.Propuesta, OportunidadEtapa.Negociacion, OportunidadEtapa.Ganada];
        var oportunidades = await db.Oportunidades
            .AsNoTracking()
            .Where(o => etapas.Contains(o.Etapa))
            .OrderBy(o => o.Id)
            .Select(o => new { o.Id, o.EmpresaId, o.Servicio, o.Etapa, o.CreatedAtUtc })
            .ToListAsync(ct);

        // When each opportunity entered the "diagnóstico" stage, and when it
        // left it (its stage moves are on its timeline).
        var ids = oportunidades.Select(o => o.Id).ToList();
        var cambios = await db.Actividades
            .AsNoTracking()
            .Where(a => a.OportunidadId != null && ids.Contains(a.OportunidadId.Value) && a.Tipo == ActividadTipo.CambioEtapa)
            .Select(a => new { OportunidadId = a.OportunidadId!.Value, a.Descripcion, a.CreatedAtUtc })
            .ToListAsync(ct);
        var entra = cambios.Where(c => c.Descripcion.EndsWith("→ Diagnóstico.")).ToDictionary(c => c.OportunidadId, c => c.CreatedAtUtc);
        var sale = cambios.Where(c => c.Descripcion.StartsWith("Etapa: Diagnóstico →")).ToDictionary(c => c.OportunidadId, c => c.CreatedAtUtc);

        var rnd = new Random(Semilla);
        var notas = new List<Actividad>();
        var ahora = DateTime.UtcNow;
        var diagnosticos = new List<Diagnostico>();

        foreach (var o in oportunidades)
        {
            if (rnd.NextDouble() > 0.8) continue;

            // Mostly processes of the opportunity's own service line.
            var candidatos = Plantillas
                .OrderBy(p => (p.Servicio == o.Servicio ? 0 : 1) + rnd.NextDouble() * 1.5)
                .Take(rnd.Next(2, 6))
                .ToList();
            var areaPrincipal = candidatos.GroupBy(p => p.Area).OrderByDescending(g => g.Count()).First().Key;

            // Within the time the opportunity spent in the stage: started early
            // on, delivered near the end (always in that order).
            var desde = entra.TryGetValue(o.Id, out var inicio) ? inicio : o.CreatedAtUtc;
            var hasta = sale.TryGetValue(o.Id, out var fin) ? fin : ahora;
            var ventana = hasta - desde;
            var creado = desde + ventana * (0.05 + rnd.NextDouble() * 0.2);
            var entregado = o.Etapa != OportunidadEtapa.Diagnostico;
            DateTime? entregadoEl = entregado ? desde + ventana * (0.6 + rnd.NextDouble() * 0.35) : null;

            var diagnostico = new Diagnostico
            {
                EmpresaId = o.EmpresaId,
                OportunidadId = o.Id,
                Titulo = $"Diagnóstico de procesos de {areaPrincipal}",
                Estado = entregado ? DiagnosticoEstado.Entregado : DiagnosticoEstado.EnCurso,
                CostoHora = rnd.Next(25, 46),
                Resumen = entregado
                    ? "Levantamiento hecho con los responsables de cada proceso. Se acordó con el cliente empezar por lo que se recupera más rápido."
                    : null,
                ResponsableId = autorId,
                EntregadoAtUtc = entregadoEl,
                CreatedAtUtc = creado,
                UpdatedAtUtc = entregadoEl ?? (creado.AddDays(rnd.Next(0, 5)) is var tocado && tocado < ahora ? tocado : ahora),
            };

            var orden = 0;
            foreach (var p in candidatos)
            {
                int Puntaje() => Math.Clamp(p.Factibilidad + rnd.Next(-1, 2), 1, 5);
                var proceso = new ProcesoEvaluado
                {
                    Nombre = p.Nombre,
                    Area = p.Area,
                    Servicio = p.Servicio,
                    EjecucionesMes = rnd.Next(p.Ejecuciones.Item1, p.Ejecuciones.Item2 + 1),
                    MinutosPorEjecucion = rnd.Next(p.Minutos.Item1, p.Minutos.Item2 + 1),
                    Personas = rnd.Next(p.Personas.Item1, p.Personas.Item2 + 1),
                    TasaError = rnd.Next(0, 9),
                    ReglasClaras = Puntaje(),
                    DatosDigitales = Puntaje(),
                    SistemasEstables = Puntaje(),
                    ProcesoEstandar = Puntaje(),
                    PocasExcepciones = Puntaje(),
                    PorcentajeAutomatizable = rnd.Next(p.Automatizable.Item1, p.Automatizable.Item2 + 1),
                    Orden = ++orden,
                    CreatedAtUtc = creado,
                };

                // DDS prices the build against what the process saves: a few
                // months of savings for a clean process, many more for a messy
                // one; the run cost is a slice of the monthly saving.
                var ahorroMensual = proceso.EjecucionesMes * proceso.MinutosPorEjecucion / 60m
                    * proceso.PorcentajeAutomatizable / 100m * diagnostico.CostoHora;
                var meses = p.Factibilidad >= 4 ? rnd.Next(3, 13) : rnd.Next(8, 25);
                proceso.CostoImplementacion = Math.Max(4_000m, Math.Round(ahorroMensual * meses / 500m) * 500m);
                proceso.CostoMensual = Math.Max(150m, Math.Round(ahorroMensual * (decimal)(0.05 + rnd.NextDouble() * 0.2) / 50m) * 50m);
                diagnostico.Procesos.Add(proceso);
            }
            diagnosticos.Add(diagnostico);

            notas.Add(Nota(o.EmpresaId, o.Id, $"Se inició el diagnóstico «{diagnostico.Titulo}».", autorId, creado));
            if (entregadoEl is { } cuando)
            {
                var t = DiagnosticoMapping.Totales(diagnostico.Procesos, diagnostico.CostoHora);
                notas.Add(Nota(o.EmpresaId, o.Id,
                    $"Diagnóstico entregado: «{diagnostico.Titulo}». {t.Procesos} {(t.Procesos == 1 ? "proceso" : "procesos")}, " +
                    $"{t.QuickWins} quick {(t.QuickWins == 1 ? "win" : "wins")}, ahorro anual estimado S/ {t.AhorroAnual.ToString("N0", CultureInfo.InvariantCulture)}.",
                    autorId, cuando));
            }
        }

        db.Diagnosticos.AddRange(diagnosticos);
        db.Actividades.AddRange(notas);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Datos demo: {Diagnosticos} diagnósticos con {Procesos} procesos.",
            diagnosticos.Count, diagnosticos.Sum(d => d.Procesos.Count));
    }

    private static Actividad Nota(int empresaId, int oportunidadId, string descripcion, int? autorId, DateTime cuando) => new()
    {
        EmpresaId = empresaId,
        OportunidadId = oportunidadId,
        Tipo = ActividadTipo.Nota,
        Descripcion = descripcion,
        AutorId = autorId,
        CreatedAtUtc = cuando,
    };

}
