using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

// --- Empresas ---------------------------------------------------------------

public class EmpresaRequest
{
    [Required, MinLength(2), MaxLength(300)]
    public required string NombreComercial { get; set; }

    [MaxLength(300)]
    public string? RazonSocial { get; set; }

    // Validated against SUNAT's check digit in the controller.
    [RegularExpression("^[0-9]{11}$", ErrorMessage = "El RUC debe tener 11 dígitos.")]
    public string? Ruc { get; set; }

    [MaxLength(200)]
    public string? Rubro { get; set; }

    [MaxLength(500)]
    public string? SitioWeb { get; set; }

    [MaxLength(500)]
    public string? Direccion { get; set; }

    [MaxLength(120)]
    public string? Distrito { get; set; }

    [MaxLength(120)]
    public string? Provincia { get; set; }

    public string? Estado { get; set; }

    [MaxLength(120)]
    public string? Origen { get; set; }

    public int? ResponsableId { get; set; }
}

public class EmpresaListItem
{
    public required int Id { get; set; }
    public required string NombreComercial { get; set; }
    public string? RazonSocial { get; set; }
    public string? Ruc { get; set; }
    public string? Rubro { get; set; }
    public string? Provincia { get; set; }
    public required string Estado { get; set; }
    public string? ResponsableNombre { get; set; }
    public required int ContactosCount { get; set; }
    public required int OportunidadesAbiertas { get; set; }
}

public class EmpresaResponse
{
    public required int Id { get; set; }
    public required string NombreComercial { get; set; }
    public string? RazonSocial { get; set; }
    public string? Ruc { get; set; }
    public string? Rubro { get; set; }
    public string? SitioWeb { get; set; }
    public string? Direccion { get; set; }
    public string? Distrito { get; set; }
    public string? Provincia { get; set; }
    public required string Estado { get; set; }
    public string? Origen { get; set; }
    public int? ResponsableId { get; set; }
    public string? ResponsableNombre { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
    public required List<ContactoResponse> Contactos { get; set; }
    public required List<OportunidadListItem> Oportunidades { get; set; }
    public required List<ActividadResponse> Actividades { get; set; }
}

// --- Contactos --------------------------------------------------------------

public class ContactoRequest
{
    [Required, MinLength(2), MaxLength(150)]
    public required string Nombres { get; set; }

    [MaxLength(150)]
    public string? Apellidos { get; set; }

    [MaxLength(150)]
    public string? Cargo { get; set; }

    [EmailAddress, MaxLength(256)]
    public string? Email { get; set; }

    [MaxLength(30)]
    public string? Telefono { get; set; }
}

public class ContactoResponse
{
    public required int Id { get; set; }
    public required string Nombres { get; set; }
    public string? Apellidos { get; set; }
    public string? Cargo { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
}

// --- Oportunidades ----------------------------------------------------------

public class CreateOportunidadRequest
{
    [Required]
    public required int EmpresaId { get; set; }

    public int? ContactoId { get; set; }

    [Required, MinLength(3), MaxLength(200)]
    public required string Titulo { get; set; }

    [Required]
    public required string Servicio { get; set; }

    public string? Etapa { get; set; }

    [Range(0, 999_999_999_999)]
    public decimal? ValorEstimado { get; set; }

    public DateTime? FechaCierreEstimada { get; set; }
    public int? ResponsableId { get; set; }

    [MaxLength(300)]
    public string? ProximaAccion { get; set; }

    public DateTime? ProximaAccionFecha { get; set; }
}

// Full update (PUT): every field is set as sent, so null clears it.
public class UpdateOportunidadRequest
{
    [Required, MinLength(3), MaxLength(200)]
    public required string Titulo { get; set; }

    [Required]
    public required string Servicio { get; set; }

    [Required]
    public required string Etapa { get; set; }

    [Range(0, 999_999_999_999)]
    public decimal? ValorEstimado { get; set; }

    public DateTime? FechaCierreEstimada { get; set; }
    public int? ContactoId { get; set; }
    public int? ResponsableId { get; set; }

    [MaxLength(300)]
    public string? ProximaAccion { get; set; }

    public DateTime? ProximaAccionFecha { get; set; }

    [MaxLength(500)]
    public string? MotivoPerdida { get; set; }
}

// Sets the opportunity's next step. With CompletarAnterior, the step being
// replaced is logged on the timeline as done.
public class ProximaAccionRequest
{
    [MaxLength(300)]
    public string? ProximaAccion { get; set; }

    public DateTime? ProximaAccionFecha { get; set; }

    public bool CompletarAnterior { get; set; }
}

// Quick stage move from the pipeline board.
public class CambiarEtapaRequest
{
    [Required]
    public required string Etapa { get; set; }

    [MaxLength(500)]
    public string? MotivoPerdida { get; set; }
}

public class OportunidadListItem
{
    public required int Id { get; set; }
    public required string Titulo { get; set; }
    public required int EmpresaId { get; set; }
    public required string EmpresaNombre { get; set; }
    public required string Servicio { get; set; }
    public required string Etapa { get; set; }
    public decimal? ValorEstimado { get; set; }
    public DateTime? FechaCierreEstimada { get; set; }
    public string? ResponsableNombre { get; set; }
    public string? ProximaAccion { get; set; }
    public DateTime? ProximaAccionFecha { get; set; }
    public DateTime? CerradaAtUtc { get; set; }
    public required DateTime UpdatedAtUtc { get; set; }
}

public class OportunidadResponse
{
    public required int Id { get; set; }
    public required string Titulo { get; set; }
    public required int EmpresaId { get; set; }
    public required string EmpresaNombre { get; set; }
    public int? ContactoId { get; set; }
    public string? ContactoNombre { get; set; }
    public required string Servicio { get; set; }
    public required string Etapa { get; set; }
    public decimal? ValorEstimado { get; set; }
    public DateTime? FechaCierreEstimada { get; set; }
    public int? ResponsableId { get; set; }
    public string? ResponsableNombre { get; set; }
    public string? ProximaAccion { get; set; }
    public DateTime? ProximaAccionFecha { get; set; }
    public string? MotivoPerdida { get; set; }
    public DateTime? CerradaAtUtc { get; set; }
    public int? SolicitudId { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
    public required List<ContactoResponse> ContactosEmpresa { get; set; }
    public required List<ActividadResponse> Actividades { get; set; }
}

// --- Actividades ------------------------------------------------------------

public class CreateActividadRequest
{
    [Required]
    public required string Tipo { get; set; }

    [Required, MinLength(1), MaxLength(2000)]
    public required string Descripcion { get; set; }
}

public class ActividadResponse
{
    public required int Id { get; set; }
    public required string Tipo { get; set; }
    public required string Descripcion { get; set; }
    public required string AutorNombre { get; set; }
    public int? OportunidadId { get; set; }
    public string? OportunidadTitulo { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
}

// --- Solicitudes web -> oportunidad -----------------------------------------

public class ConvertirSolicitudRequest
{
    // Attach to an existing company, or create a new one with this name.
    public int? EmpresaId { get; set; }

    [MinLength(2), MaxLength(300)]
    public string? EmpresaNombre { get; set; }

    [MaxLength(200)]
    public string? Titulo { get; set; }
}
