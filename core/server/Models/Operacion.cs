namespace Server.Models;

public static class BotEstado
{
    public const string Activo = "activo";
    public const string EnPausa = "en_pausa";
    // No longer runs (the client dropped the process, or it was replaced).
    public const string Retirado = "retirado";

    public static readonly string[] All = [Activo, EnPausa, Retirado];
}

public static class Severidad
{
    public const string Critica = "critica";
    public const string Alta = "alta";
    public const string Media = "media";
    public const string Baja = "baja";

    public static readonly string[] All = [Critica, Alta, Media, Baja];

    public static string Label(string severidad) => severidad switch
    {
        Critica => "Crítica",
        Alta => "Alta",
        Media => "Media",
        Baja => "Baja",
        _ => severidad,
    };
}

public static class IncidenciaEstado
{
    public const string Abierta = "abierta";
    public const string EnAtencion = "en_atencion";
    // Waiting on the client: an access, a sample, a confirmation.
    public const string EsperandoCliente = "esperando_cliente";
    public const string Resuelta = "resuelta";

    public static readonly string[] All = [Abierta, EnAtencion, EsperandoCliente, Resuelta];
    public static readonly string[] Abiertas = [Abierta, EnAtencion, EsperandoCliente];

    public static string Label(string estado) => estado switch
    {
        Abierta => "Abierta",
        EnAtencion => "En atención",
        EsperandoCliente => "Esperando al cliente",
        Resuelta => "Resuelta",
        _ => estado,
    };
}

// Why it happened, set when it's resolved: what keeps a bot from running.
public static class IncidenciaCausa
{
    // A screen, portal or report of the client's changed.
    public const string CambioSistema = "cambio_sistema";
    // An expired or locked password, token or certificate.
    public const string Credenciales = "credenciales";
    // Input the bot couldn't process (a malformed file, missing data).
    public const string Datos = "datos";
    public const string Infraestructura = "infraestructura";
    public const string ErrorBot = "error_bot";
    // Not a failure: a question or a change the client asked for.
    public const string Solicitud = "solicitud";
    public const string Otro = "otro";

    public static readonly string[] All = [CambioSistema, Credenciales, Datos, Infraestructura, ErrorBot, Solicitud, Otro];

    public static string Label(string? causa) => causa switch
    {
        CambioSistema => "cambio en un sistema del cliente",
        Credenciales => "credenciales vencidas o bloqueadas",
        Datos => "datos de entrada",
        Infraestructura => "infraestructura",
        ErrorBot => "error del bot",
        Solicitud => "solicitud del cliente",
        _ => "otra",
    };
}

public static class IncidenciaCanal
{
    // An alert from the bot's monitoring.
    public const string Monitoreo = "monitoreo";
    public const string Correo = "correo";
    public const string Whatsapp = "whatsapp";
    public const string Llamada = "llamada";
    // Found by DDS's own team.
    public const string Interno = "interno";

    public static readonly string[] All = [Monitoreo, Correo, Whatsapp, Llamada, Interno];
}

public static class SeguimientoTipo
{
    public const string Nota = "nota";
    // Logged automatically: a change of state, severity or owner.
    public const string Cambio = "cambio";
}

public static class ContratoEstado
{
    public const string Vigente = "vigente";
    // Ended on purpose: the client didn't renew.
    public const string Terminado = "terminado";

    public static readonly string[] All = [Vigente, Terminado];
}

// An automation running at a client (a bot, an AI flow, a dashboard's
// refresh), usually from a project's process. It keeps what the diagnosis
// estimated it would save, to compare with what it saves each month.
public class Bot
{
    public int Id { get; set; }
    public required string Nombre { get; set; }
    public string? Descripcion { get; set; }
    public required string Servicio { get; set; }
    public required string Estado { get; set; }

    public int EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }
    public int? ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
    // One bot per process at most.
    public int? ProcesoProyectoId { get; set; }
    public ProcesoProyecto? ProcesoProyecto { get; set; }

    // UiPath, Power Automate, n8n, Python… and when it runs.
    public string? Plataforma { get; set; }
    public string? Horario { get; set; }

    // Dates only.
    public DateTime EnProduccionDesde { get; set; }
    public DateTime? RetiradoEl { get; set; }

    public int? ResponsableId { get; set; }
    public AdminUser? Responsable { get; set; }

    // The estimate (from the diagnosis): the hours a month it frees, what
    // an hour of the client's staff costs, and the manual minutes each case
    // took — what values the cases the bot actually handles.
    public decimal HorasMesEstimadas { get; set; }
    public decimal CostoHora { get; set; }
    public decimal MinutosPorCaso { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<MedicionBot> Mediciones { get; set; } = [];
}

// A bot's month, from its orchestrator's logs: how often it ran, how many
// runs failed, and the cases it handled on its own or passed to a person.
public class MedicionBot
{
    public int Id { get; set; }
    public int BotId { get; set; }
    public Bot? Bot { get; set; }

    // First day of the month.
    public DateTime Mes { get; set; }
    public int Ejecuciones { get; set; }
    public int EjecucionesFallidas { get; set; }
    public int CasosProcesados { get; set; }
    // Business exceptions sent to a person (not counted as saved).
    public int CasosDerivados { get; set; }
    public string? Notas { get; set; }

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

// A support ticket: something that broke or that the client asked for,
// usually about one of its bots, with its SLA (Services/Sla.cs) and history.
public class Incidencia
{
    public int Id { get; set; }

    // "INC-2026-0042".
    public required string Codigo { get; set; }
    public required string Titulo { get; set; }
    public string? Descripcion { get; set; }

    public int EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }
    public int? BotId { get; set; }
    public Bot? Bot { get; set; }

    public required string Severidad { get; set; }
    public required string Estado { get; set; }
    public required string Canal { get; set; }
    public string? Causa { get; set; }
    // Who at the client reported it.
    public string? ReportadoPor { get; set; }

    public int? ResponsableId { get; set; }
    public AdminUser? Responsable { get; set; }

    // When it was reported: the SLA counts from here.
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? PrimeraRespuestaAtUtc { get; set; }
    // The SLA clock stops while waiting on the client.
    public DateTime? PausadaDesdeUtc { get; set; }
    public int MinutosEnPausa { get; set; }
    public DateTime? ResueltaAtUtc { get; set; }
    public string? Solucion { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<SeguimientoIncidencia> Seguimiento { get; set; } = [];
}

public class SeguimientoIncidencia
{
    public int Id { get; set; }
    public int IncidenciaId { get; set; }
    public Incidencia? Incidencia { get; set; }

    public required string Tipo { get; set; }
    public required string Texto { get; set; }
    public int? AutorId { get; set; }
    public AdminUser? Autor { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

// A client's support and operation agreement (the monthly line of its
// proposal): what it pays a month and until when. Renewing extends it.
public class ContratoSoporte
{
    public int Id { get; set; }
    public int EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }
    public int? PropuestaId { get; set; }
    public Propuesta? Propuesta { get; set; }

    public required string Nombre { get; set; }
    public required string Estado { get; set; }
    public decimal MontoMensual { get; set; }
    public required string Moneda { get; set; }

    // Dates only.
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public string? Notas { get; set; }

    // The opportunity opened to renew it, if any.
    public int? OportunidadRenovacionId { get; set; }
    public Oportunidad? OportunidadRenovacion { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

// A license a bot needs (a robot, an orchestrator, a Power BI seat): a
// client's (EmpresaId) or DDS's own, paid by the client or included in the
// support fee.
public class Licencia
{
    public int Id { get; set; }
    public int? EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }
    public int? BotId { get; set; }
    public Bot? Bot { get; set; }

    public required string Nombre { get; set; }
    public string? Proveedor { get; set; }
    public int Cantidad { get; set; } = 1;
    public decimal? CostoAnual { get; set; }
    public required string Moneda { get; set; }
    public bool PagaCliente { get; set; } = true;

    // Date only.
    public DateTime VenceEl { get; set; }
    public string? Notas { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
