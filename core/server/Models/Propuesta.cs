namespace Server.Models;

public static class PropuestaEstado
{
    public const string Borrador = "borrador";
    public const string Enviada = "enviada";
    public const string Aceptada = "aceptada";
    public const string Rechazada = "rechazada";
    // A newer version took its place.
    public const string Reemplazada = "reemplazada";

    public static readonly string[] All = [Borrador, Enviada, Aceptada, Rechazada, Reemplazada];
}

public static class Moneda
{
    public const string Soles = "PEN";
    public const string Dolares = "USD";

    public static readonly string[] All = [Soles, Dolares];
}

public static class PropuestaItemTipo
{
    // One-off: building and launching the solution.
    public const string Implementacion = "implementacion";
    // Recurring, per month: support, operation, licenses.
    public const string Mensual = "mensual";

    public static readonly string[] All = [Implementacion, Mensual];
}

// DDS's technical and commercial proposal to a client, usually built from a
// diagnosis. Sent versions are frozen: changing one means a new version
// (same Codigo, Version + 1), and the old one is marked "reemplazada".
public class Propuesta
{
    public int Id { get; set; }

    // "P-2026-0012": shared by every version of the same proposal.
    public required string Codigo { get; set; }
    public int Version { get; set; } = 1;

    public int EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }
    public int? OportunidadId { get; set; }
    public Oportunidad? Oportunidad { get; set; }
    public int? DiagnosticoId { get; set; }
    public Diagnostico? Diagnostico { get; set; }

    public required string Titulo { get; set; }
    public required string Estado { get; set; }
    public required string Moneda { get; set; }

    // Prices are before IGV (Peru's 18% VAT), added on top.
    public decimal DescuentoPorcentaje { get; set; }

    // Annual saving the scope is expected to bring (from the diagnosis), to
    // show the client the return next to the price. Optional.
    public decimal? AhorroAnualEstimado { get; set; }

    public string? Introduccion { get; set; }
    public string? Supuestos { get; set; }
    public string? Exclusiones { get; set; }
    public string? CondicionesPago { get; set; }
    public DateTime? ValidaHasta { get; set; }

    public int? ResponsableId { get; set; }
    public AdminUser? Responsable { get; set; }

    public DateTime? EnviadaAtUtc { get; set; }
    public DateTime? RespondidaAtUtc { get; set; }
    public string? MotivoRechazo { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<PropuestaItem> Items { get; set; } = [];
    public List<PropuestaFase> Fases { get; set; } = [];
}

public class PropuestaItem
{
    public int Id { get; set; }
    public int PropuestaId { get; set; }
    public Propuesta? Propuesta { get; set; }

    public required string Tipo { get; set; }
    public required string Descripcion { get; set; }
    // What's delivered, for the scope section of the document.
    public string? Detalle { get; set; }
    public decimal Cantidad { get; set; } = 1;
    public decimal PrecioUnitario { get; set; }
    public int Orden { get; set; }

    // The diagnosis process this line automates, if it came from one (no FK:
    // a soft link, like ProcesoProyecto.ProcesoOrigenId).
    public int? ProcesoOrigenId { get; set; }
}

// A step of the schedule, in weeks; they run one after the other.
public class PropuestaFase
{
    public int Id { get; set; }
    public int PropuestaId { get; set; }
    public Propuesta? Propuesta { get; set; }

    public required string Nombre { get; set; }
    public string? Descripcion { get; set; }
    public int Semanas { get; set; }
    public int Orden { get; set; }
}
