namespace Server.Models;

public static class OportunidadEtapa
{
    public const string Nuevo = "nuevo";
    public const string Contactado = "contactado";
    // DDS's free process diagnosis with the client.
    public const string Diagnostico = "diagnostico";
    public const string Propuesta = "propuesta";
    public const string Negociacion = "negociacion";
    public const string Ganada = "ganada";
    public const string Perdida = "perdida";

    public static readonly string[] All = [Nuevo, Contactado, Diagnostico, Propuesta, Negociacion, Ganada, Perdida];
    public static readonly string[] Abiertas = [Nuevo, Contactado, Diagnostico, Propuesta, Negociacion];

    public static string Label(string etapa) => etapa switch
    {
        Nuevo => "Nuevo",
        Contactado => "Contactado",
        Diagnostico => "Diagnóstico",
        Propuesta => "Propuesta",
        Negociacion => "Negociación",
        Ganada => "Ganada",
        Perdida => "Perdida",
        _ => etapa,
    };
}

public static class ServicioTipo
{
    public const string Analitica = "analitica";
    public const string Rpa = "rpa";
    public const string Ia = "ia";

    public static readonly string[] All = [Analitica, Rpa, Ia];

    public static string Label(string servicio) => servicio switch
    {
        Analitica => "Analítica de Datos",
        Rpa => "Automatización RPA",
        Ia => "Inteligencia Artificial",
        _ => servicio,
    };
}

public class Oportunidad
{
    public int Id { get; set; }
    public int EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }

    public int? ContactoId { get; set; }
    public Contacto? Contacto { get; set; }

    public required string Titulo { get; set; }
    public required string Servicio { get; set; }
    public required string Etapa { get; set; }

    // Estimated deal value, in soles (PEN).
    public decimal? ValorEstimado { get; set; }
    public DateTime? FechaCierreEstimada { get; set; }

    public int? ResponsableId { get; set; }
    public AdminUser? Responsable { get; set; }

    // The single next step, so nothing goes cold: what to do and by when.
    public string? ProximaAccion { get; set; }
    public DateTime? ProximaAccionFecha { get; set; }

    public string? MotivoPerdida { get; set; }

    // When it was won or lost; null while it's open (reopening clears it).
    public DateTime? CerradaAtUtc { get; set; }

    // The web contact-form request this opportunity was converted from, if any.
    public int? SolicitudId { get; set; }
    public Client? Solicitud { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<Actividad> Actividades { get; set; } = [];
}
