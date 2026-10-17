using Server.Models;

namespace Server.Services;

// What a bot really saves against what the diagnosis estimated, in one
// place (core/client/app/lib/operacion.ts mirrors the monthly figure for
// the form's preview). Each case the bot handles on its own saves the
// manual minutes it used to take, at the client's cost per hour; cases it
// passes to a person save nothing. Halves round up, as Math.round does in
// the mirror.
public static class Ahorro
{
    public sealed record Mes(decimal HorasAhorradas, decimal AhorroReal, decimal AhorroEstimado, decimal? Cumplimiento, decimal? TasaExito);

    public static decimal EstimadoMensual(Bot b) => Math.Round(b.HorasMesEstimadas * b.CostoHora, 2, MidpointRounding.AwayFromZero);

    // The estimate for a month, prorated by the days the bot was in
    // production (it went live or was retired during the month).
    public static decimal EstimadoDelMes(Bot b, DateTime mes)
    {
        var inicio = new DateTime(mes.Year, mes.Month, 1);
        var fin = inicio.AddMonths(1);
        var desde = b.EnProduccionDesde.Date > inicio ? b.EnProduccionDesde.Date : inicio;
        var hasta = b.RetiradoEl is { } retiro && retiro.Date < fin ? retiro.Date : fin;
        if (hasta <= desde) return 0;
        return Math.Round(EstimadoMensual(b) * (hasta - desde).Days / (fin - inicio).Days, 2, MidpointRounding.AwayFromZero);
    }

    public static Mes Calcular(Bot b, MedicionBot m)
    {
        var horas = m.CasosProcesados * b.MinutosPorCaso / 60m;
        var real = Math.Round(horas * b.CostoHora, 2, MidpointRounding.AwayFromZero);
        var estimado = EstimadoDelMes(b, m.Mes);
        return new Mes(
            Math.Round(horas, 1, MidpointRounding.AwayFromZero),
            real,
            estimado,
            estimado > 0 ? Math.Round(real / estimado, 3, MidpointRounding.AwayFromZero) : null,
            m.Ejecuciones > 0 ? Math.Round((decimal)(m.Ejecuciones - m.EjecucionesFallidas) / m.Ejecuciones, 3, MidpointRounding.AwayFromZero) : null);
    }

    // The last month that's over: what the summaries compare.
    public static DateTime UltimoMesCerrado(DateTime hoy) => new DateTime(hoy.Year, hoy.Month, 1).AddMonths(-1);

    // The months a bot should have a record for, up to the last one closed.
    public static IEnumerable<DateTime> MesesEnProduccion(Bot b, DateTime hoy)
    {
        var ultimo = UltimoMesCerrado(hoy);
        if (b.RetiradoEl is { } retiro)
        {
            // Retired on the 1st: its last month is the one before.
            var ultimoActivo = new DateTime(retiro.Year, retiro.Month, 1).AddMonths(retiro.Day == 1 ? -1 : 0);
            if (ultimoActivo < ultimo) ultimo = ultimoActivo;
        }
        for (var mes = new DateTime(b.EnProduccionDesde.Year, b.EnProduccionDesde.Month, 1); mes <= ultimo; mes = mes.AddMonths(1))
            yield return mes;
    }
}
