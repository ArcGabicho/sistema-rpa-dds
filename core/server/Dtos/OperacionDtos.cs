using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

// --- Bots ------------------------------------------------------------------

public class BotRequest
{
    [Required(ErrorMessage = "Nombra el bot."), MinLength(3, ErrorMessage = "El nombre debe tener al menos 3 caracteres."), MaxLength(200)]
    public required string Nombre { get; set; }

    [MaxLength(2000)] public string? Descripcion { get; set; }
    public string Servicio { get; set; } = "rpa";
    [MaxLength(100)] public string? Plataforma { get; set; }
    [MaxLength(200)] public string? Horario { get; set; }
    public DateTime EnProduccionDesde { get; set; }
    public int? ResponsableId { get; set; }

    [Range(0, 100_000, ErrorMessage = "Las horas estimadas van de 0 a 100 000.")]
    public decimal HorasMesEstimadas { get; set; }

    [Range(0, 10_000, ErrorMessage = "El costo por hora va de 0 a 10 000.")]
    public decimal CostoHora { get; set; }

    [Range(0, 10_000, ErrorMessage = "Los minutos por caso van de 0 a 10 000.")]
    public decimal MinutosPorCaso { get; set; }
}

// From a project's process (its company, figures and stage), or for a company.
public class CreateBotRequest : BotRequest
{
    public int? ProcesoProyectoId { get; set; }
    public int? EmpresaId { get; set; }
}

public class UpdateBotRequest : BotRequest
{
    [Required] public required string Estado { get; set; }
    public DateTime? RetiradoEl { get; set; }
}

// What the new-bot form starts from, for a process.
public class BorradorBotResponse
{
    public required string Nombre { get; set; }
    public required int EmpresaId { get; set; }
    public required string EmpresaNombre { get; set; }
    public int? ProyectoId { get; set; }
    public string? ProyectoNombre { get; set; }
    public int? ProcesoProyectoId { get; set; }
    public required string Servicio { get; set; }
    public decimal HorasMesEstimadas { get; set; }
    public decimal CostoHora { get; set; }
    public decimal MinutosPorCaso { get; set; }
    // The figures came from the diagnosis.
    public required bool DesdeDiagnostico { get; set; }
    // The process already has its bot.
    public int? BotExistenteId { get; set; }
}

public class MedicionRequest
{
    public DateTime Mes { get; set; }

    [Range(0, 10_000_000, ErrorMessage = "Las ejecuciones no pueden ser negativas.")]
    public int Ejecuciones { get; set; }

    [Range(0, 10_000_000, ErrorMessage = "Las ejecuciones fallidas no pueden ser negativas.")]
    public int EjecucionesFallidas { get; set; }

    [Range(0, 100_000_000, ErrorMessage = "Los casos no pueden ser negativos.")]
    public int CasosProcesados { get; set; }

    [Range(0, 100_000_000, ErrorMessage = "Los casos derivados no pueden ser negativos.")]
    public int CasosDerivados { get; set; }

    [MaxLength(500)] public string? Notas { get; set; }
}

public class MedicionResponse
{
    public required DateTime Mes { get; set; }
    public required int Ejecuciones { get; set; }
    public required int EjecucionesFallidas { get; set; }
    public required int CasosProcesados { get; set; }
    public required int CasosDerivados { get; set; }
    public string? Notas { get; set; }
    public required decimal HorasAhorradas { get; set; }
    public required decimal AhorroReal { get; set; }
    public required decimal AhorroEstimado { get; set; }
    public decimal? Cumplimiento { get; set; }
    public decimal? TasaExito { get; set; }
}

// Filled in one place (BotsController.Llenar), so no `required` here.
public class BotListItem
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public int EmpresaId { get; set; }
    public string EmpresaNombre { get; set; } = "";
    public string Servicio { get; set; } = "";
    public string? Plataforma { get; set; }
    public string Estado { get; set; } = "";
    public string? ResponsableNombre { get; set; }
    public DateTime EnProduccionDesde { get; set; }
    public decimal AhorroMensualEstimado { get; set; }
    public int IncidenciasAbiertas { get; set; }
    // An open critical or high incident.
    public bool ConFalla { get; set; }
    // The last closed month, and its record if there's one.
    public DateTime UltimoMes { get; set; }
    public MedicionResponse? Ultimo { get; set; }
    // Running but without a record for the last closed month.
    public bool SinRegistro { get; set; }
}

public class AcumuladoBot
{
    public required int Meses { get; set; }
    public required decimal HorasAhorradas { get; set; }
    public required decimal AhorroReal { get; set; }
    public required decimal AhorroEstimado { get; set; }
    public decimal? Cumplimiento { get; set; }
}

public class BotResponse : BotListItem
{
    public string? Descripcion { get; set; }
    public int? ProyectoId { get; set; }
    public string? ProyectoNombre { get; set; }
    public int? ProcesoProyectoId { get; set; }
    public string? ProcesoNombre { get; set; }
    public string? Horario { get; set; }
    public DateTime? RetiradoEl { get; set; }
    public int? ResponsableId { get; set; }
    public decimal HorasMesEstimadas { get; set; }
    public decimal CostoHora { get; set; }
    public decimal MinutosPorCaso { get; set; }
    public List<MedicionResponse> Mediciones { get; set; } = [];
    public AcumuladoBot? Acumulado { get; set; }
    public List<DateTime> MesesSinRegistro { get; set; } = [];
    public List<IncidenciaListItem> Incidencias { get; set; } = [];
    public List<LicenciaResponse> Licencias { get; set; } = [];
}

public class SerieMes
{
    public required DateTime Mes { get; set; }
    public required decimal Real { get; set; }
    public required decimal Estimado { get; set; }
}

public class BotsResumenResponse
{
    public required int Activos { get; set; }
    public required int EnPausa { get; set; }
    public required DateTime Mes { get; set; }
    public required decimal AhorroRealMes { get; set; }
    public required decimal AhorroEstimadoMes { get; set; }
    public decimal? CumplimientoMes { get; set; }
    public required int SinRegistro { get; set; }
    public required decimal AhorroRealAcumulado { get; set; }
    public required decimal HorasAcumuladas { get; set; }
    public required List<SerieMes> Serie { get; set; }
}

// --- Incidents ---------------------------------------------------------------

public class CreateIncidenciaRequest
{
    // Its bot (and so its company), or just the company.
    public int? BotId { get; set; }
    public int? EmpresaId { get; set; }

    [Required(ErrorMessage = "Resume la incidencia en el título."), MinLength(5, ErrorMessage = "El título debe tener al menos 5 caracteres."), MaxLength(200)]
    public required string Titulo { get; set; }

    [MaxLength(4000)] public string? Descripcion { get; set; }
    public string Severidad { get; set; } = "media";
    public string Canal { get; set; } = "correo";
    [MaxLength(200)] public string? ReportadoPor { get; set; }
    public int? ResponsableId { get; set; }
}

public class UpdateIncidenciaRequest
{
    [Required(ErrorMessage = "Resume la incidencia en el título."), MinLength(5, ErrorMessage = "El título debe tener al menos 5 caracteres."), MaxLength(200)]
    public required string Titulo { get; set; }

    [MaxLength(4000)] public string? Descripcion { get; set; }
    [Required] public required string Severidad { get; set; }
    [Required] public required string Canal { get; set; }
    public string? Causa { get; set; }
    [MaxLength(200)] public string? ReportadoPor { get; set; }
    public int? ResponsableId { get; set; }
    public int? BotId { get; set; }
}

public class EstadoIncidenciaRequest
{
    [Required] public required string Estado { get; set; }
    // Both required to resolve it.
    public string? Causa { get; set; }
    [MaxLength(4000)] public string? Solucion { get; set; }
}

public class SeguimientoRequest
{
    [Required(ErrorMessage = "Escribe la nota."), MinLength(2, ErrorMessage = "Escribe la nota."), MaxLength(2000)]
    public required string Texto { get; set; }
}

public class SlaResponse
{
    public required int ObjetivoRespuestaHoras { get; set; }
    public required int ObjetivoResolucionHoras { get; set; }
    public required DateTime VenceRespuestaUtc { get; set; }
    public required DateTime VenceResolucionUtc { get; set; }
    public bool? RespuestaCumplida { get; set; }
    public bool? ResolucionCumplida { get; set; }
    public required string Semaforo { get; set; }
}

// Filled in one place (IncidenciasController.Llenar), so no `required` here.
public class IncidenciaListItem
{
    public int Id { get; set; }
    public string Codigo { get; set; } = "";
    public string Titulo { get; set; } = "";
    public int EmpresaId { get; set; }
    public string EmpresaNombre { get; set; } = "";
    public int? BotId { get; set; }
    public string? BotNombre { get; set; }
    public string Severidad { get; set; } = "";
    public string Estado { get; set; } = "";
    public string? Causa { get; set; }
    public string? ResponsableNombre { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? ResueltaAtUtc { get; set; }
    public SlaResponse? Sla { get; set; }
}

public class SeguimientoResponse
{
    public required int Id { get; set; }
    public required string Tipo { get; set; }
    public required string Texto { get; set; }
    public string? AutorNombre { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
}

public class IncidenciaResponse : IncidenciaListItem
{
    public string? Descripcion { get; set; }
    public string Canal { get; set; } = "";
    public string? ReportadoPor { get; set; }
    public int? ResponsableId { get; set; }
    public DateTime? PrimeraRespuestaAtUtc { get; set; }
    // Time waiting on the client so far (the SLA clock was stopped), and
    // since when it's waiting now, if it is.
    public int MinutosEnPausa { get; set; }
    public DateTime? PausadaDesdeUtc { get; set; }
    public string? Solucion { get; set; }
    public List<SeguimientoResponse> Seguimiento { get; set; } = [];
}

public class CausaCantidad
{
    public required string Causa { get; set; }
    public required int Cantidad { get; set; }
}

public class IncidenciasResumenResponse
{
    public required int Abiertas { get; set; }
    // Critical or high, still open.
    public required int Graves { get; set; }
    public required int FueraDeSla { get; set; }
    // Resolved in the last 90 days.
    public required int Resueltas90 { get; set; }
    public decimal? CumplimientoSla90 { get; set; }
    public decimal? HorasMedianaResolucion90 { get; set; }
    public required List<CausaCantidad> PorCausa90 { get; set; }
}

// --- Contracts, licenses and what expires ----------------------------------------

public class ContratoRequest
{
    public int EmpresaId { get; set; }
    public int? PropuestaId { get; set; }

    [Required(ErrorMessage = "Nombra el contrato."), MinLength(3, ErrorMessage = "Nombra el contrato."), MaxLength(200)]
    public required string Nombre { get; set; }

    public string Estado { get; set; } = "vigente";

    [Range(0, 10_000_000, ErrorMessage = "El monto mensual no puede ser negativo.")]
    public decimal MontoMensual { get; set; }

    public string Moneda { get; set; } = "PEN";
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    [MaxLength(1000)] public string? Notas { get; set; }
}

public class RenovarContratoRequest
{
    [Range(1, 36, ErrorMessage = "Renueva de 1 a 36 meses.")]
    public int Meses { get; set; } = 12;

    // The new monthly fee; the same one when empty.
    [Range(0, 10_000_000, ErrorMessage = "El monto mensual no puede ser negativo.")]
    public decimal? MontoMensual { get; set; }
}

public class ContratoResponse
{
    public required int Id { get; set; }
    public required int EmpresaId { get; set; }
    public required string EmpresaNombre { get; set; }
    public int? PropuestaId { get; set; }
    public string? PropuestaNombre { get; set; }
    public required string Nombre { get; set; }
    public required string Estado { get; set; }
    public required decimal MontoMensual { get; set; }
    public required string Moneda { get; set; }
    public required DateTime FechaInicio { get; set; }
    public required DateTime FechaFin { get; set; }
    public string? Notas { get; set; }
    public int? OportunidadRenovacionId { get; set; }
    public string? OportunidadRenovacionTitulo { get; set; }
    public string? OportunidadRenovacionEtapa { get; set; }
    // vigente, por_vencer, vencido or terminado; days to its end.
    public required string Vencimiento { get; set; }
    public required int Dias { get; set; }
}

public class LicenciaRequest
{
    public int? EmpresaId { get; set; }
    public int? BotId { get; set; }

    [Required(ErrorMessage = "Nombra la licencia."), MinLength(2, ErrorMessage = "Nombra la licencia."), MaxLength(200)]
    public required string Nombre { get; set; }

    [MaxLength(100)] public string? Proveedor { get; set; }

    [Range(1, 100_000, ErrorMessage = "La cantidad va de 1 a 100 000.")]
    public int Cantidad { get; set; } = 1;

    [Range(0, 10_000_000, ErrorMessage = "El costo anual no puede ser negativo.")]
    public decimal? CostoAnual { get; set; }

    public string Moneda { get; set; } = "USD";
    public bool PagaCliente { get; set; } = true;
    public DateTime VenceEl { get; set; }
    [MaxLength(1000)] public string? Notas { get; set; }
}

public class RenovarLicenciaRequest
{
    public DateTime VenceEl { get; set; }
}

public class LicenciaResponse
{
    public required int Id { get; set; }
    public int? EmpresaId { get; set; }
    public string? EmpresaNombre { get; set; }
    public int? BotId { get; set; }
    public string? BotNombre { get; set; }
    public required string Nombre { get; set; }
    public string? Proveedor { get; set; }
    public required int Cantidad { get; set; }
    public decimal? CostoAnual { get; set; }
    public required string Moneda { get; set; }
    public required bool PagaCliente { get; set; }
    public required DateTime VenceEl { get; set; }
    public string? Notas { get; set; }
    public required string Vencimiento { get; set; }
    public required int Dias { get; set; }
}

// One thing that expires — a contract, a license or a vault credential —
// for the combined calendar.
public class VencimientoItem
{
    public required string Tipo { get; set; }
    public required int Id { get; set; }
    public required string Nombre { get; set; }
    public int? EmpresaId { get; set; }
    public string? EmpresaNombre { get; set; }
    public required DateTime VenceEl { get; set; }
    public required int Dias { get; set; }
    public required string Estado { get; set; }
    public string? Detalle { get; set; }
    public int? OportunidadRenovacionId { get; set; }
}
