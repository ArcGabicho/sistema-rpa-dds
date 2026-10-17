using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

public class CreatePropuestaRequest
{
    // The client: a company, an opportunity, or a diagnosis to build it from
    // (its processes become the scope; ProcesoIds picks which ones).
    public int? EmpresaId { get; set; }
    public int? OportunidadId { get; set; }
    public int? DiagnosticoId { get; set; }
    public List<int>? ProcesoIds { get; set; }

    [MaxLength(200)]
    public string? Titulo { get; set; }

    public string Moneda { get; set; } = "PEN";
}

public class PropuestaItemDto
{
    [Required]
    public required string Tipo { get; set; }

    [Required(ErrorMessage = "Cada ítem necesita una descripción."), MinLength(2, ErrorMessage = "Cada ítem necesita una descripción."), MaxLength(300)]
    public required string Descripcion { get; set; }

    [MaxLength(2000)]
    public string? Detalle { get; set; }

    [Range(0.01, 100_000, ErrorMessage = "La cantidad debe ser mayor que 0.")]
    public decimal Cantidad { get; set; } = 1;

    [Range(0, 1_000_000_000, ErrorMessage = "El precio no puede ser negativo.")]
    public decimal PrecioUnitario { get; set; }

    public int? ProcesoOrigenId { get; set; }
}

public class PropuestaFaseDto
{
    [Required(ErrorMessage = "Cada fase necesita un nombre."), MinLength(2, ErrorMessage = "Cada fase necesita un nombre."), MaxLength(200)]
    public required string Nombre { get; set; }

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    [Range(1, 104, ErrorMessage = "Cada fase dura entre 1 y 104 semanas.")]
    public int Semanas { get; set; } = 1;
}

// The whole editable document of a draft, saved at once.
public class UpdatePropuestaRequest
{
    [Required(ErrorMessage = "Ponle un título a la propuesta."), MinLength(3, ErrorMessage = "El título debe tener al menos 3 caracteres."), MaxLength(200)]
    public required string Titulo { get; set; }

    [Required]
    public required string Moneda { get; set; }

    [Range(0, 100, ErrorMessage = "El descuento va de 0 a 100 %.")]
    public decimal DescuentoPorcentaje { get; set; }

    [Range(0, 1_000_000_000)]
    public decimal? AhorroAnualEstimado { get; set; }

    [MaxLength(4000)] public string? Introduccion { get; set; }
    [MaxLength(4000)] public string? Supuestos { get; set; }
    [MaxLength(4000)] public string? Exclusiones { get; set; }
    [MaxLength(1000)] public string? CondicionesPago { get; set; }

    public DateTime? ValidaHasta { get; set; }
    public int? ResponsableId { get; set; }

    [MaxLength(100, ErrorMessage = "Máximo 100 ítems.")]
    public List<PropuestaItemDto> Items { get; set; } = [];

    [MaxLength(30, ErrorMessage = "Máximo 30 fases.")]
    public List<PropuestaFaseDto> Fases { get; set; } = [];
}

public class RechazarPropuestaRequest
{
    [Required(ErrorMessage = "Anota por qué la rechazaron."), MinLength(3, ErrorMessage = "Anota por qué la rechazaron."), MaxLength(500)]
    public required string Motivo { get; set; }
}

public class TotalesPropuestaResponse
{
    public required decimal SubtotalImplementacion { get; set; }
    public required decimal Descuento { get; set; }
    public required decimal BaseImplementacion { get; set; }
    public required decimal IgvImplementacion { get; set; }
    public required decimal TotalImplementacion { get; set; }
    public required decimal BaseMensual { get; set; }
    public required decimal IgvMensual { get; set; }
    public required decimal TotalMensual { get; set; }
    public required decimal ValorPrimerAnio { get; set; }
    public required int Semanas { get; set; }
    public decimal? PaybackMeses { get; set; }
    public decimal? Roi12Meses { get; set; }
}

public class PropuestaVersionItem
{
    public required int Id { get; set; }
    public required int Version { get; set; }
    public required string Estado { get; set; }
    public required DateTime UpdatedAtUtc { get; set; }
}

public class PropuestaListItem
{
    public required int Id { get; set; }
    public required string Codigo { get; set; }
    public required int Version { get; set; }
    public required string Titulo { get; set; }
    public required int EmpresaId { get; set; }
    public required string EmpresaNombre { get; set; }
    public int? OportunidadId { get; set; }
    public string? OportunidadTitulo { get; set; }
    public required string Estado { get; set; }
    public required string Moneda { get; set; }
    public required TotalesPropuestaResponse Totales { get; set; }
    public DateTime? EnviadaAtUtc { get; set; }
    public DateTime? ValidaHasta { get; set; }
    public required DateTime UpdatedAtUtc { get; set; }
}

public class PropuestaResponse
{
    public required int Id { get; set; }
    public required string Codigo { get; set; }
    public required int Version { get; set; }
    public required string Titulo { get; set; }
    public required int EmpresaId { get; set; }
    public required string EmpresaNombre { get; set; }
    public string? EmpresaRazonSocial { get; set; }
    public string? EmpresaRuc { get; set; }
    public int? OportunidadId { get; set; }
    public string? OportunidadTitulo { get; set; }
    public string? OportunidadEtapa { get; set; }
    public string? ContactoNombre { get; set; }
    public string? ContactoCargo { get; set; }
    public int? DiagnosticoId { get; set; }
    public string? DiagnosticoTitulo { get; set; }
    public required string Estado { get; set; }
    public required string Moneda { get; set; }
    public required decimal DescuentoPorcentaje { get; set; }
    public decimal? AhorroAnualEstimado { get; set; }
    public string? Introduccion { get; set; }
    public string? Supuestos { get; set; }
    public string? Exclusiones { get; set; }
    public string? CondicionesPago { get; set; }
    public DateTime? ValidaHasta { get; set; }
    public int? ResponsableId { get; set; }
    public string? ResponsableNombre { get; set; }
    public DateTime? EnviadaAtUtc { get; set; }
    public DateTime? RespondidaAtUtc { get; set; }
    public string? MotivoRechazo { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
    public required DateTime UpdatedAtUtc { get; set; }
    public required List<PropuestaItemDto> Items { get; set; }
    public required List<PropuestaFaseDto> Fases { get; set; }
    public required TotalesPropuestaResponse Totales { get; set; }
    public required List<PropuestaVersionItem> Versiones { get; set; }
}
