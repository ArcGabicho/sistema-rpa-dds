namespace Server.Models;

public static class DiagnosticoEstado
{
    public const string EnCurso = "en_curso";
    // Sent to the client.
    public const string Entregado = "entregado";
    public const string Archivado = "archivado";

    public static readonly string[] All = [EnCurso, Entregado, Archivado];
}

// DDS's process diagnosis at a client: the processes surveyed, how feasible
// automating each one is, and what it would save. Usually tied to the
// opportunity in its "diagnóstico" stage.
public class Diagnostico
{
    public int Id { get; set; }

    public int EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }

    public int? OportunidadId { get; set; }
    public Oportunidad? Oportunidad { get; set; }

    public required string Titulo { get; set; }
    public required string Estado { get; set; }

    // What an hour of the client's staff costs, all-in, in soles. Each
    // process can override it (work done by more senior people).
    public decimal CostoHora { get; set; }

    // Executive summary for the report.
    public string? Resumen { get; set; }

    public int? ResponsableId { get; set; }
    public AdminUser? Responsable { get; set; }

    public DateTime? EntregadoAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<ProcesoEvaluado> Procesos { get; set; } = [];
}

// One candidate process: how much work it takes today, how automatable it
// is (five 1–5 criteria) and what automating it would cost.
public class ProcesoEvaluado
{
    public int Id { get; set; }
    public int DiagnosticoId { get; set; }
    public Diagnostico? Diagnostico { get; set; }

    public required string Nombre { get; set; }
    public string? Area { get; set; }
    public string? Descripcion { get; set; }
    public required string Servicio { get; set; }

    // Volume today.
    public int EjecucionesMes { get; set; }
    public decimal MinutosPorEjecucion { get; set; }
    public int Personas { get; set; }
    public decimal TasaError { get; set; }
    public decimal? CostoHora { get; set; }

    // Feasibility, 1 (no) to 5 (fully).
    public int ReglasClaras { get; set; }
    public int DatosDigitales { get; set; }
    public int SistemasEstables { get; set; }
    public int ProcesoEstandar { get; set; }
    public int PocasExcepciones { get; set; }

    // Share of the work the automation would take over, 0–100.
    public decimal PorcentajeAutomatizable { get; set; }

    // DDS's estimate: one-off build, and monthly run cost (licenses,
    // infrastructure, support).
    public decimal CostoImplementacion { get; set; }
    public decimal CostoMensual { get; set; }

    public int Orden { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
