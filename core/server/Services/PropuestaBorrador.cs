using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services;

// Builds a proposal's first draft, from a diagnosis or blank, and hands out
// proposal codes. Shared by the proposals API and the demo seeder.
public static class PropuestaBorrador
{
    public const int DiasValidez = 30;

    public const string SupuestosBase =
        "El cliente designa un responsable por proceso y brinda los accesos a los sistemas necesarios.\n" +
        "Los procesos y las pantallas que se automatizan no cambian durante la implementación.\n" +
        "Las pruebas se hacen con datos representativos, en un ambiente acordado con el cliente.";

    public const string ExclusionesBase =
        "Licencias de software de terceros, salvo que figuren en la inversión.\n" +
        "Cambios o desarrollos en los sistemas del cliente.\n" +
        "Procesos que no estén en el alcance de esta propuesta.";

    public const string CondicionesPagoBase =
        "Implementación: 50 % a la firma y 50 % a la puesta en producción. Servicio mensual: facturación a mes vencido.";

    // "P-2026-0012": the next free number for the year (Lima time).
    public static async Task<string> SiguienteCodigoAsync(AppDbContext db, CancellationToken ct)
    {
        var prefijo = $"P-{Lima.Hoy.Year}-";
        var codigos = await db.Propuestas
            .Where(p => p.Codigo.StartsWith(prefijo))
            .Select(p => p.Codigo)
            .Distinct()
            .ToListAsync(ct);
        var ultimo = codigos
            .Select(c => int.TryParse(c[prefijo.Length..], NumberStyles.None, CultureInfo.InvariantCulture, out var n) ? n : 0)
            .DefaultIfEmpty(0)
            .Max();
        return $"{prefijo}{ultimo + 1:0000}";
    }

    // Fills a new proposal from a diagnosis: one one-off item per chosen
    // process (at its estimated build cost), one monthly item with their run
    // costs, a schedule sized to the scope, and the diagnosis's saving.
    public static void DesdeDiagnostico(Propuesta propuesta, Diagnostico diagnostico, IReadOnlyList<ProcesoEvaluado> procesos)
    {
        var orden = 0;
        foreach (var p in procesos)
        {
            var c = Roi.Calcular(p, diagnostico.CostoHora);
            propuesta.Items.Add(new PropuestaItem
            {
                Tipo = PropuestaItemTipo.Implementacion,
                Descripcion = $"{Prefijo(p.Servicio)}: {p.Nombre}",
                Detalle = $"Levantamiento detallado, desarrollo, pruebas con el usuario y puesta en producción. " +
                          $"Libera unas {c.HorasLiberadasMes.ToString("N0", CultureInfo.InvariantCulture)} horas al mes.",
                Cantidad = 1,
                PrecioUnitario = p.CostoImplementacion,
                Orden = ++orden,
            });
        }

        var mensual = procesos.Sum(p => p.CostoMensual);
        if (mensual > 0)
        {
            propuesta.Items.Add(new PropuestaItem
            {
                Tipo = PropuestaItemTipo.Mensual,
                Descripcion = "Soporte, monitoreo y operación",
                Detalle = "Monitoreo de las ejecuciones, atención de incidencias y ajustes menores por cambios en los sistemas.",
                Cantidad = 1,
                PrecioUnitario = mensual,
                Orden = ++orden,
            });
        }

        propuesta.DiagnosticoId = diagnostico.Id;
        propuesta.AhorroAnualEstimado = procesos.Sum(p => Roi.Calcular(p, diagnostico.CostoHora).AhorroAnual);
        var horas = procesos.Sum(p => Roi.Calcular(p, diagnostico.CostoHora).HorasLiberadasMes);
        propuesta.Introduccion =
            $"A partir del diagnóstico «{diagnostico.Titulo}», proponemos automatizar {procesos.Count} " +
            $"{(procesos.Count == 1 ? "proceso" : "procesos")} que, según las estimaciones levantadas con su equipo, " +
            $"liberarían unas {horas.ToString("N0", CultureInfo.InvariantCulture)} horas de trabajo al mes.";
        FasesBase(propuesta, procesos.Count);
    }

    public static void TextosBase(Propuesta propuesta)
    {
        propuesta.Supuestos ??= SupuestosBase;
        propuesta.Exclusiones ??= ExclusionesBase;
        propuesta.CondicionesPago ??= CondicionesPagoBase;
    }

    // Survey, build (two weeks per process, 2 to 12), user testing, launch.
    public static void FasesBase(Propuesta propuesta, int procesos)
    {
        propuesta.Fases.Clear();
        (string Nombre, string Descripcion, int Semanas)[] fases =
        [
            ("Levantamiento detallado", "Revisión de cada proceso con sus responsables y definición de los casos a cubrir.", 1),
            ("Desarrollo", "Construcción de las soluciones y pruebas internas de DDS.", Math.Clamp(procesos * 2, 2, 12)),
            ("Pruebas con el usuario", "Validación con el equipo del cliente sobre casos reales.", procesos > 3 ? 2 : 1),
            ("Puesta en producción", "Paso a producción y acompañamiento durante las primeras ejecuciones.", 1),
        ];
        var orden = 0;
        foreach (var (nombre, descripcion, semanas) in fases)
            propuesta.Fases.Add(new PropuestaFase { Nombre = nombre, Descripcion = descripcion, Semanas = semanas, Orden = ++orden });
    }

    private static string Prefijo(string servicio) => servicio switch
    {
        ServicioTipo.Ia => "Solución de IA",
        ServicioTipo.Analitica => "Analítica",
        _ => "Automatización",
    };
}
