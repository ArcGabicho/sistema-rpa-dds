namespace Server.Dtos;

public class RecentClientSummary
{
    public required int Id { get; set; }
    public required string FullName { get; set; }
    public required string Status { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
}

public class EtapaResumen
{
    public required string Etapa { get; set; }
    public required int Cantidad { get; set; }
    public required decimal Valor { get; set; }
}

// One month of the pipeline's results, "2026-05" in Lima time.
public class MesResumen
{
    public required string Mes { get; set; }
    public required int Creadas { get; set; }
    public required int Ganadas { get; set; }
    public required int Perdidas { get; set; }
    public required decimal ValorGanado { get; set; }
}

public class ServicioResumen
{
    public required string Servicio { get; set; }
    public required int Cantidad { get; set; }
    public required decimal Valor { get; set; }
}

public class ProximaAccionItem
{
    public required int OportunidadId { get; set; }
    public required string Titulo { get; set; }
    public required string EmpresaNombre { get; set; }
    public required string ProximaAccion { get; set; }
    public required DateTime ProximaAccionFecha { get; set; }
    public string? ResponsableNombre { get; set; }
}

public class DashboardSummaryResponse
{
    // Web contact-form requests.
    public required int ClientsTotal { get; set; }
    public required int ClientsNew { get; set; }
    public required List<RecentClientSummary> RecentClients { get; set; }

    // Commercial pipeline.
    public required int EmpresasTotal { get; set; }
    public required int EmpresasClientes { get; set; }
    public required int OportunidadesAbiertas { get; set; }
    public required decimal ValorEmbudo { get; set; }
    public required int AccionesVencidas { get; set; }
    public required List<EtapaResumen> Embudo { get; set; }
    public required List<ProximaAccionItem> ProximasAcciones { get; set; }

    // The last six months, oldest first, and the win rate over them
    // (won / closed; null when nothing closed).
    public required List<MesResumen> Mensual { get; set; }
    public decimal? TasaCierre { get; set; }
    public required List<ServicioResumen> PorServicio { get; set; }
}

// Delivery at a glance: active projects, what's stuck, and the milestones
// coming due.
public class EntregaResumenResponse
{
    public required int ProyectosActivos { get; set; }
    public required int ProyectosAtrasados { get; set; }
    public required int TareasBloqueadas { get; set; }
    public required int TareasVencidas { get; set; }
    // Sent to the client, waiting for their approval.
    public required int PddEnRevision { get; set; }
    // In testing or production with no bot registered yet.
    public required int ProcesosSinBot { get; set; }
    public required List<HitoProximo> Hitos { get; set; }
}

public class HitoProximo
{
    public required int ProyectoId { get; set; }
    public required string ProyectoNombre { get; set; }
    public required string EmpresaNombre { get; set; }
    public required string Hito { get; set; }
    public required DateTime FechaFin { get; set; }
    public required bool Atrasado { get; set; }
}

public class MiTarea
{
    public required int Id { get; set; }
    public required string Titulo { get; set; }
    public required int ProyectoId { get; set; }
    public required string ProyectoNombre { get; set; }
    public required string Estado { get; set; }
    public DateTime? FechaLimite { get; set; }
    public required bool Vencida { get; set; }
    public string? Bloqueo { get; set; }
}

// What's assigned to the signed-in user, per module they can see (null
// for the ones they can't).
public class MiTrabajoResponse
{
    public List<MiTarea>? Tareas { get; set; }
    public int TareasTotal { get; set; }
    public List<ProximaAccionItem>? Acciones { get; set; }
    public int AccionesTotal { get; set; }
    public List<IncidenciaListItem>? Incidencias { get; set; }
    public int IncidenciasTotal { get; set; }
}
