using Server.Models;

namespace Server.Services;

// Support response and resolution targets, by severity. Calendar hours
// (bots run nights and weekends too); the clock stops while the incident
// waits on the client.
public static class Sla
{
    public static (int RespuestaHoras, int ResolucionHoras) Objetivo(string severidad) => severidad switch
    {
        Severidad.Critica => (1, 8),
        Severidad.Alta => (4, 24),
        Severidad.Media => (8, 72),
        _ => (24, 120),
    };

    public static class Semaforo
    {
        public const string ATiempo = "a_tiempo";
        // Less than a quarter of the resolution time left.
        public const string EnRiesgo = "en_riesgo";
        public const string Vencido = "vencido";
        public const string Pausado = "pausado";
        public const string Cumplido = "cumplido";
        public const string Incumplido = "incumplido";
    }

    public sealed record Resultado(
        int ObjetivoRespuestaHoras,
        int ObjetivoResolucionHoras,
        DateTime VenceRespuestaUtc,
        DateTime VenceResolucionUtc,
        bool? RespuestaCumplida,
        bool? ResolucionCumplida,
        string Semaforo);

    public static Resultado Evaluar(Incidencia i, DateTime ahoraUtc)
    {
        var (respuesta, resolucion) = Objetivo(i.Severidad);
        var fin = i.ResueltaAtUtc ?? ahoraUtc;
        var pausa = TimeSpan.FromMinutes(i.MinutosEnPausa) + (i.PausadaDesdeUtc is { } desde && fin > desde ? fin - desde : TimeSpan.Zero);
        var venceRespuesta = i.CreatedAtUtc.AddHours(respuesta);
        var venceResolucion = i.CreatedAtUtc.AddHours(resolucion) + pausa;

        bool? respondida = i.PrimeraRespuestaAtUtc is { } r ? r <= venceRespuesta : ahoraUtc > venceRespuesta ? false : null;

        if (i.ResueltaAtUtc is { } resuelta)
        {
            var cumplida = resuelta <= venceResolucion;
            return new(respuesta, resolucion, venceRespuesta, venceResolucion, respondida, cumplida, cumplida ? Semaforo.Cumplido : Semaforo.Incumplido);
        }

        var semaforo = ahoraUtc > venceResolucion ? Semaforo.Vencido
            : i.PausadaDesdeUtc is not null ? Semaforo.Pausado
            : venceResolucion - ahoraUtc < TimeSpan.FromHours(resolucion / 4.0) ? Semaforo.EnRiesgo
            : Semaforo.ATiempo;
        return new(respuesta, resolucion, venceRespuesta, venceResolucion, respondida, ahoraUtc > venceResolucion ? false : null, semaforo);
    }
}
