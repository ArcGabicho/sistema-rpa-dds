using Server.Dtos;
using Server.Models;

namespace Server.Services;

public static class DiagnosticoMapping
{
    public static ProcesoResponse ToProceso(ProcesoEvaluado p, decimal costoHoraDiagnostico)
    {
        var c = Roi.Calcular(p, costoHoraDiagnostico);
        return new ProcesoResponse
        {
            Id = p.Id,
            Orden = p.Orden,
            Nombre = p.Nombre,
            Area = p.Area,
            Descripcion = p.Descripcion,
            Servicio = p.Servicio,
            EjecucionesMes = p.EjecucionesMes,
            MinutosPorEjecucion = p.MinutosPorEjecucion,
            Personas = p.Personas,
            TasaError = p.TasaError,
            CostoHora = p.CostoHora,
            ReglasClaras = p.ReglasClaras,
            DatosDigitales = p.DatosDigitales,
            SistemasEstables = p.SistemasEstables,
            ProcesoEstandar = p.ProcesoEstandar,
            PocasExcepciones = p.PocasExcepciones,
            PorcentajeAutomatizable = p.PorcentajeAutomatizable,
            CostoImplementacion = p.CostoImplementacion,
            CostoMensual = p.CostoMensual,
            Calculo = new CalculoResponse
            {
                HorasMes = c.HorasMes,
                HorasLiberadasMes = c.HorasLiberadasMes,
                Fte = c.Fte,
                AhorroMensual = c.AhorroMensual,
                AhorroAnual = c.AhorroAnual,
                CostoPrimerAnio = c.CostoPrimerAnio,
                Roi12Meses = c.Roi12Meses,
                PaybackMeses = c.PaybackMeses,
                Factibilidad = c.Factibilidad,
                Cuadrante = c.Cuadrante,
            },
        };
    }

    // The whole diagnosis: savings and costs added up, then the same return
    // math as for a single process.
    public static TotalesResponse Totales(IReadOnlyCollection<ProcesoEvaluado> procesos, decimal costoHoraDiagnostico)
    {
        var calculos = procesos.Select(p => Roi.Calcular(p, costoHoraDiagnostico)).ToList();
        var ahorroMensual = calculos.Sum(c => c.AhorroMensual);
        var inversion = procesos.Sum(p => p.CostoImplementacion);
        var costoMensual = procesos.Sum(p => p.CostoMensual);
        var (costoPrimerAnio, roi, payback) = Roi.Retorno(ahorroMensual, inversion, costoMensual);
        var liberadas = calculos.Sum(c => c.HorasLiberadasMes);

        return new TotalesResponse
        {
            Procesos = procesos.Count,
            QuickWins = calculos.Count(c => c.Cuadrante == Roi.Cuadrante.QuickWin),
            HorasLiberadasMes = liberadas,
            Fte = Math.Round(liberadas / Roi.HorasPorFte, 2),
            AhorroAnual = Math.Round(ahorroMensual * 12, 2),
            Inversion = inversion,
            CostoMensual = costoMensual,
            CostoPrimerAnio = costoPrimerAnio,
            Roi12Meses = roi,
            PaybackMeses = payback,
        };
    }
}
