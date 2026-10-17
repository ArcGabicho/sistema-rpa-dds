using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

public class CreateProyectoRequest
{
    // From an accepted proposal (its phases, scope and client), or blank for a company.
    public int? PropuestaId { get; set; }
    public int? EmpresaId { get; set; }

    [MaxLength(200)]
    public string? Nombre { get; set; }

    // Defaults to the next Monday.
    public DateTime? FechaInicio { get; set; }
    public int? ResponsableId { get; set; }
}

public class UpdateProyectoRequest
{
    [Required(ErrorMessage = "Ponle un nombre al proyecto."), MinLength(3, ErrorMessage = "El nombre debe tener al menos 3 caracteres."), MaxLength(200)]
    public required string Nombre { get; set; }

    [MaxLength(2000)]
    public string? Descripcion { get; set; }

    [Required]
    public required string Estado { get; set; }

    public DateTime FechaInicio { get; set; }
    public DateTime FechaFinPlan { get; set; }
    public int? ResponsableId { get; set; }
}

public class HitoRequest
{
    [Required(ErrorMessage = "Nombra el hito."), MinLength(2, ErrorMessage = "Nombra el hito."), MaxLength(200)]
    public required string Nombre { get; set; }

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    public string Estado { get; set; } = "pendiente";
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
}

public class TareaRequest
{
    [Required(ErrorMessage = "Escribe la tarea."), MinLength(2, ErrorMessage = "Escribe la tarea."), MaxLength(300)]
    public required string Titulo { get; set; }

    public int? HitoId { get; set; }
    public string Estado { get; set; } = "pendiente";
    public int? ResponsableId { get; set; }
    public DateTime? FechaLimite { get; set; }

    [MaxLength(500)]
    public string? Bloqueo { get; set; }
}

public class CreateProcesoProyectoRequest
{
    [Required(ErrorMessage = "Nombra el proceso."), MinLength(3, ErrorMessage = "Nombra el proceso."), MaxLength(200)]
    public required string Nombre { get; set; }

    [MaxLength(120)]
    public string? Area { get; set; }

    public string Servicio { get; set; } = "rpa";
}

// The process with its PDD, saved together from the PDD editor.
public class UpdateProcesoProyectoRequest
{
    [Required(ErrorMessage = "Nombra el proceso."), MinLength(3, ErrorMessage = "Nombra el proceso."), MaxLength(200)]
    public required string Nombre { get; set; }

    [MaxLength(120)] public string? Area { get; set; }
    [Required] public required string Servicio { get; set; }
    [Required] public required string Etapa { get; set; }
    [MaxLength(8000)] public string? NotasLevantamiento { get; set; }

    [Required] public required string PddEstado { get; set; }
    [MaxLength(6000)] public string? PddObjetivo { get; set; }
    [MaxLength(6000)] public string? PddAlcance { get; set; }
    [MaxLength(6000)] public string? PddSistemas { get; set; }
    [MaxLength(6000)] public string? PddEntradas { get; set; }
    [MaxLength(6000)] public string? PddSalidas { get; set; }
    [MaxLength(6000)] public string? PddPasosActuales { get; set; }
    [MaxLength(6000)] public string? PddReglas { get; set; }
    [MaxLength(6000)] public string? PddExcepciones { get; set; }
    [MaxLength(6000)] public string? PddPasosPropuestos { get; set; }
    [MaxLength(6000)] public string? PddPreguntas { get; set; }

    // An AI draft went into this version.
    public bool PddConIa { get; set; }

    [MaxLength(200)] public string? PddAprobadoPor { get; set; }
}

public class HitoResponse
{
    public required int Id { get; set; }
    public required string Nombre { get; set; }
    public string? Descripcion { get; set; }
    public required string Estado { get; set; }
    public required DateTime FechaInicio { get; set; }
    public required DateTime FechaFin { get; set; }
    public DateTime? CompletadoAtUtc { get; set; }
    public required bool Atrasado { get; set; }
}

public class TareaResponse
{
    public required int Id { get; set; }
    public required string Titulo { get; set; }
    public int? HitoId { get; set; }
    public required string Estado { get; set; }
    public int? ResponsableId { get; set; }
    public string? ResponsableNombre { get; set; }
    public DateTime? FechaLimite { get; set; }
    public string? Bloqueo { get; set; }
    public DateTime? CompletadaAtUtc { get; set; }
    public required bool Vencida { get; set; }
}

public class ProcesoProyectoItem
{
    public required int Id { get; set; }
    public required string Nombre { get; set; }
    public string? Area { get; set; }
    public required string Servicio { get; set; }
    public required string Etapa { get; set; }
    public required string PddEstado { get; set; }
    public required int PddVersion { get; set; }
    public required bool TienePdd { get; set; }
    // Its bot, once it's in production.
    public int? BotId { get; set; }
}

// Filled in one place (ProyectosController.Llenar), so no `required` here.
public class ProyectoListItem
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public int EmpresaId { get; set; }
    public string EmpresaNombre { get; set; } = "";
    public string Estado { get; set; } = "";
    public string? ResponsableNombre { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFinPlan { get; set; }
    public DateTime? FechaFinReal { get; set; }
    public int TareasTotal { get; set; }
    public int TareasHechas { get; set; }
    public int TareasBloqueadas { get; set; }
    public int Procesos { get; set; }
    public bool Atrasado { get; set; }
    public string? HitoActual { get; set; }
}

public class ProyectoResponse : ProyectoListItem
{
    public string? Descripcion { get; set; }
    public int? OportunidadId { get; set; }
    public string? OportunidadTitulo { get; set; }
    public int? PropuestaId { get; set; }
    public string? PropuestaNombre { get; set; }
    public int? ResponsableId { get; set; }
    public required List<HitoResponse> Hitos { get; set; }
    public required List<TareaResponse> Tareas { get; set; }
    public required List<ProcesoProyectoItem> ProcesosLista { get; set; }
}

public class ProcesoProyectoResponse : UpdateProcesoProyectoRequest
{
    public required int Id { get; set; }
    public required int ProyectoId { get; set; }
    public required string ProyectoNombre { get; set; }
    public required int EmpresaId { get; set; }
    public required string EmpresaNombre { get; set; }
    public string? ContactoNombre { get; set; }
    public required int PddVersion { get; set; }
    public DateTime? PddAprobadoAtUtc { get; set; }
    public required DateTime UpdatedAtUtc { get; set; }

    // From the diagnosis, when the process came from one.
    public int? EjecucionesMes { get; set; }
    public decimal? MinutosPorEjecucion { get; set; }
    public int? Personas { get; set; }
    public decimal? HorasLiberadasMes { get; set; }
    public string? ComoSeHaceHoy { get; set; }
}

public class IaEstadoResponse
{
    public required bool Configurada { get; set; }
    public required string Modelo { get; set; }
}

// An AI draft of a PDD, as the editor's text fields (one item per line).
public class BorradorPddResponse
{
    public required string PddObjetivo { get; set; }
    public required string PddAlcance { get; set; }
    public required string PddSistemas { get; set; }
    public required string PddEntradas { get; set; }
    public required string PddSalidas { get; set; }
    public required string PddPasosActuales { get; set; }
    public required string PddReglas { get; set; }
    public required string PddExcepciones { get; set; }
    public required string PddPasosPropuestos { get; set; }
    public required string PddPreguntas { get; set; }
    public required string Modelo { get; set; }
}
