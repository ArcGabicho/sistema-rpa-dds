using Server.Models;

namespace Server.Services;

// The diagnosis math, in one place: the API returns these figures, and the
// form's live preview (core/client/app/lib/roi.ts) mirrors them.
public static class Roi
{
    // Working hours in a month for one full-time person.
    public const decimal HorasPorFte = 160m;
    // From this score up (0–100) a process counts as readily automatable.
    public const int FactibilidadAlta = 60;
    // A payback within this many months counts as a fast return.
    public const decimal RetornoRapidoMeses = 12m;

    public static class Cuadrante
    {
        public const string QuickWin = "quick_win";
        public const string Estrategico = "estrategico";
        public const string MejoraMenor = "mejora_menor";
        public const string Postergar = "postergar";
    }

    public sealed record Resultado(
        decimal HorasMes,
        decimal HorasLiberadasMes,
        decimal Fte,
        decimal AhorroMensual,
        decimal AhorroAnual,
        decimal CostoPrimerAnio,
        decimal? Roi12Meses,
        decimal? PaybackMeses,
        int Factibilidad,
        string Cuadrante);

    public static Resultado Calcular(ProcesoEvaluado p, decimal costoHoraDiagnostico)
    {
        var costoHora = p.CostoHora ?? costoHoraDiagnostico;
        var horasMes = p.EjecucionesMes * p.MinutosPorEjecucion / 60m;
        var liberadas = horasMes * p.PorcentajeAutomatizable / 100m;
        var ahorroMensual = liberadas * costoHora;
        var factibilidad = Factibilidad(p);

        var (costoPrimerAnio, roi, payback) = Retorno(ahorroMensual, p.CostoImplementacion, p.CostoMensual);
        return new Resultado(
            Math.Round(horasMes, 1),
            Math.Round(liberadas, 1),
            Math.Round(liberadas / HorasPorFte, 2),
            Math.Round(ahorroMensual, 2),
            Math.Round(ahorroMensual * 12, 2),
            costoPrimerAnio,
            roi,
            payback,
            factibilidad,
            CuadranteDe(factibilidad, payback));
    }

    // The five 1–5 criteria averaged onto 0–100 (all 1s = 0, all 5s = 100).
    public static int Factibilidad(ProcesoEvaluado p)
    {
        var promedio = (p.ReglasClaras + p.DatosDigitales + p.SistemasEstables + p.ProcesoEstandar + p.PocasExcepciones) / 5m;
        return (int)Math.Round((promedio - 1) / 4 * 100, MidpointRounding.AwayFromZero);
    }

    // First-year ROI and months to recover the build cost from the net
    // monthly saving; null when it never pays back.
    public static (decimal CostoPrimerAnio, decimal? Roi12Meses, decimal? PaybackMeses) Retorno(
        decimal ahorroMensual, decimal costoImplementacion, decimal costoMensual)
    {
        var costoPrimerAnio = costoImplementacion + costoMensual * 12;
        decimal? roi = costoPrimerAnio > 0 ? Math.Round((ahorroMensual * 12 - costoPrimerAnio) / costoPrimerAnio, 3) : null;
        var neto = ahorroMensual - costoMensual;
        decimal? payback = neto > 0 ? Math.Round(costoImplementacion / neto, 1) : null;
        return (Math.Round(costoPrimerAnio, 2), roi, payback);
    }

    public static string CuadranteDe(int factibilidad, decimal? paybackMeses)
    {
        var factible = factibilidad >= FactibilidadAlta;
        var rapido = paybackMeses is not null && paybackMeses <= RetornoRapidoMeses;
        return (factible, rapido) switch
        {
            (true, true) => Cuadrante.QuickWin,
            (false, true) => Cuadrante.Estrategico,
            (true, false) => Cuadrante.MejoraMenor,
            _ => Cuadrante.Postergar,
        };
    }
}
