namespace Server.Models;

public static class ProyectoEstado
{
    public const string Planificado = "planificado";
    public const string EnCurso = "en_curso";
    public const string EnPausa = "en_pausa";
    public const string Completado = "completado";
    public const string Cancelado = "cancelado";

    public static readonly string[] All = [Planificado, EnCurso, EnPausa, Completado, Cancelado];
}

public static class HitoEstado
{
    public const string Pendiente = "pendiente";
    public const string EnCurso = "en_curso";
    public const string Completado = "completado";

    public static readonly string[] All = [Pendiente, EnCurso, Completado];
}

public static class TareaEstado
{
    public const string Pendiente = "pendiente";
    public const string EnProgreso = "en_progreso";
    public const string Bloqueada = "bloqueada";
    public const string Hecha = "hecha";

    public static readonly string[] All = [Pendiente, EnProgreso, Bloqueada, Hecha];
}

// Where a process's automation is in its life cycle.
public static class EtapaDesarrollo
{
    public const string Levantamiento = "levantamiento";
    public const string Desarrollo = "desarrollo";
    public const string Pruebas = "pruebas";
    public const string Produccion = "produccion";

    public static readonly string[] All = [Levantamiento, Desarrollo, Pruebas, Produccion];
}

public static class PddEstado
{
    public const string Borrador = "borrador";
    // Sent to the client for review.
    public const string EnRevision = "en_revision";
    public const string Aprobado = "aprobado";

    public static readonly string[] All = [Borrador, EnRevision, Aprobado];
}

// The delivery of what a client bought, usually from an accepted proposal:
// its milestones (the proposal's phases, dated), tasks, and each process to
// automate with its PDD.
public class Proyecto
{
    public int Id { get; set; }
    public required string Nombre { get; set; }
    public string? Descripcion { get; set; }
    public required string Estado { get; set; }

    public int EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }
    public int? OportunidadId { get; set; }
    public Oportunidad? Oportunidad { get; set; }
    public int? PropuestaId { get; set; }
    public Propuesta? Propuesta { get; set; }

    public int? ResponsableId { get; set; }
    public AdminUser? Responsable { get; set; }

    // Dates only.
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFinPlan { get; set; }
    public DateTime? FechaFinReal { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<Hito> Hitos { get; set; } = [];
    public List<Tarea> Tareas { get; set; } = [];
    public List<ProcesoProyecto> Procesos { get; set; } = [];
}

public class Hito
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }

    public required string Nombre { get; set; }
    public string? Descripcion { get; set; }
    public required string Estado { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public DateTime? CompletadoAtUtc { get; set; }
    public int Orden { get; set; }
}

public class Tarea
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
    public int? HitoId { get; set; }
    public Hito? Hito { get; set; }

    public required string Titulo { get; set; }
    public required string Estado { get; set; }
    public int? ResponsableId { get; set; }
    public AdminUser? Responsable { get; set; }
    public DateTime? FechaLimite { get; set; }
    // What it's waiting on, while blocked.
    public string? Bloqueo { get; set; }
    public DateTime? CompletadaAtUtc { get; set; }
    public int Orden { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

// A process the project automates, with its figures from the diagnosis and
// its PDD (Process Definition Document): the agreed description of how it's
// done today and how the automation will do it, approved by the client
// before development starts.
public class ProcesoProyecto
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }

    // The diagnosis process it came from, if any (no FK: a soft link that
    // survives the diagnosis being deleted).
    public int? ProcesoOrigenId { get; set; }

    public required string Nombre { get; set; }
    public string? Area { get; set; }
    public required string Servicio { get; set; }
    public required string Etapa { get; set; }
    public int Orden { get; set; }

    // What the consultant wrote during the survey session: the raw input for
    // the PDD (and for drafting it with AI).
    public string? NotasLevantamiento { get; set; }

    public required string PddEstado { get; set; }
    public string? PddObjetivo { get; set; }
    public string? PddAlcance { get; set; }
    public string? PddSistemas { get; set; }
    public string? PddEntradas { get; set; }
    public string? PddSalidas { get; set; }
    public string? PddPasosActuales { get; set; }
    public string? PddReglas { get; set; }
    public string? PddExcepciones { get; set; }
    public string? PddPasosPropuestos { get; set; }
    public string? PddPreguntas { get; set; }
    public int PddVersion { get; set; } = 1;
    // Whether an AI draft went into it (shown on the document).
    public bool PddConIa { get; set; }
    public string? PddAprobadoPor { get; set; }
    public DateTime? PddAprobadoAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
