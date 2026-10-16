using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

public class CreateDiagnosticoRequest
{
    // The company, or an opportunity (whose company is used).
    public int? EmpresaId { get; set; }
    public int? OportunidadId { get; set; }

    [Required(ErrorMessage = "Ponle un título al diagnóstico."), MinLength(3, ErrorMessage = "El título debe tener al menos 3 caracteres."), MaxLength(200)]
    public required string Titulo { get; set; }

    [Range(0, 10_000, ErrorMessage = "El costo por hora debe estar entre 0 y 10 000.")]
    public decimal CostoHora { get; set; } = 30;

    [MaxLength(4000)]
    public string? Resumen { get; set; }

    public int? ResponsableId { get; set; }
}

public class UpdateDiagnosticoRequest
{
    [Required(ErrorMessage = "Ponle un título al diagnóstico."), MinLength(3, ErrorMessage = "El título debe tener al menos 3 caracteres."), MaxLength(200)]
    public required string Titulo { get; set; }

    [Required]
    public required string Estado { get; set; }

    [Range(0, 10_000, ErrorMessage = "El costo por hora debe estar entre 0 y 10 000.")]
    public decimal CostoHora { get; set; }

    [MaxLength(4000)]
    public string? Resumen { get; set; }

    public int? ResponsableId { get; set; }
}

public class ProcesoRequest
{
    [Required(ErrorMessage = "Ponle nombre al proceso."), MinLength(3, ErrorMessage = "El nombre debe tener al menos 3 caracteres."), MaxLength(200)]
    public required string Nombre { get; set; }

    [MaxLength(120)]
    public string? Area { get; set; }

    [MaxLength(2000)]
    public string? Descripcion { get; set; }

    [Required]
    public required string Servicio { get; set; }

    [Range(0, 1_000_000)]
    public int EjecucionesMes { get; set; }

    [Range(0, 100_000)]
    public decimal MinutosPorEjecucion { get; set; }

    [Range(0, 100_000)]
    public int Personas { get; set; }

    [Range(0, 100)]
    public decimal TasaError { get; set; }

    [Range(0, 10_000)]
    public decimal? CostoHora { get; set; }

    [Range(1, 5)] public int ReglasClaras { get; set; } = 3;
    [Range(1, 5)] public int DatosDigitales { get; set; } = 3;
    [Range(1, 5)] public int SistemasEstables { get; set; } = 3;
    [Range(1, 5)] public int ProcesoEstandar { get; set; } = 3;
    [Range(1, 5)] public int PocasExcepciones { get; set; } = 3;

    [Range(0, 100)]
    public decimal PorcentajeAutomatizable { get; set; }

    [Range(0, 1_000_000_000)]
    public decimal CostoImplementacion { get; set; }

    [Range(0, 100_000_000)]
    public decimal CostoMensual { get; set; }
}

public class CalculoResponse
{
    public required decimal HorasMes { get; set; }
    public required decimal HorasLiberadasMes { get; set; }
    public required decimal Fte { get; set; }
    public required decimal AhorroMensual { get; set; }
    public required decimal AhorroAnual { get; set; }
    public required decimal CostoPrimerAnio { get; set; }
    public decimal? Roi12Meses { get; set; }
    public decimal? PaybackMeses { get; set; }
    public required int Factibilidad { get; set; }
    public required string Cuadrante { get; set; }
}

public class ProcesoResponse : ProcesoRequest
{
    public required int Id { get; set; }
    public required int Orden { get; set; }
    public required CalculoResponse Calculo { get; set; }
}

// The diagnosis as a whole: all its processes added up.
public class TotalesResponse
{
    public required int Procesos { get; set; }
    public required int QuickWins { get; set; }
    public required decimal HorasLiberadasMes { get; set; }
    public required decimal Fte { get; set; }
    public required decimal AhorroAnual { get; set; }
    public required decimal Inversion { get; set; }
    public required decimal CostoMensual { get; set; }
    public required decimal CostoPrimerAnio { get; set; }
    public decimal? Roi12Meses { get; set; }
    public decimal? PaybackMeses { get; set; }
}

public class DiagnosticoListItem
{
    public required int Id { get; set; }
    public required string Titulo { get; set; }
    public required int EmpresaId { get; set; }
    public required string EmpresaNombre { get; set; }
    public int? OportunidadId { get; set; }
    public string? OportunidadTitulo { get; set; }
    public required string Estado { get; set; }
    public string? ResponsableNombre { get; set; }
    public required TotalesResponse Totales { get; set; }
    public required DateTime UpdatedAtUtc { get; set; }
}

public class DiagnosticoResponse
{
    public required int Id { get; set; }
    public required string Titulo { get; set; }
    public required int EmpresaId { get; set; }
    public required string EmpresaNombre { get; set; }
    public int? OportunidadId { get; set; }
    public string? OportunidadTitulo { get; set; }
    public string? OportunidadEtapa { get; set; }
    public required string Estado { get; set; }
    public required decimal CostoHora { get; set; }
    public string? Resumen { get; set; }
    public int? ResponsableId { get; set; }
    public string? ResponsableNombre { get; set; }
    public DateTime? EntregadoAtUtc { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
    public required DateTime UpdatedAtUtc { get; set; }
    public required List<ProcesoResponse> Procesos { get; set; }
    public required TotalesResponse Totales { get; set; }
}
