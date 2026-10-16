using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

// Metadata of a secret: everything except its value.
public class SecretoMetadataRequest
{
    [Required(ErrorMessage = "Ponle un nombre a la credencial."), MinLength(2, ErrorMessage = "El nombre debe tener al menos 2 caracteres."), MaxLength(200, ErrorMessage = "El nombre admite hasta 200 caracteres.")]
    public required string Nombre { get; set; }

    [Required(ErrorMessage = "Elige el tipo de credencial.")]
    public required string Tipo { get; set; }

    public int? EmpresaId { get; set; }

    [MaxLength(256)]
    public string? Usuario { get; set; }

    [MaxLength(500)]
    public string? Url { get; set; }

    [MaxLength(1000)]
    public string? Notas { get; set; }

    public DateTime? VenceEl { get; set; }
    public bool Restringido { get; set; }
}

public class CreateSecretoRequest : SecretoMetadataRequest
{
    [Required(ErrorMessage = "Ingresa el valor que se guardará cifrado."), MaxLength(10_000, ErrorMessage = "El valor admite hasta 10 000 caracteres.")]
    public required string Valor { get; set; }
}

// Replaces the value (a new password or key). VenceEl is the new value's
// expiry: null means it doesn't expire.
public class RotarSecretoRequest
{
    [Required(ErrorMessage = "Ingresa el valor que se guardará cifrado."), MaxLength(10_000, ErrorMessage = "El valor admite hasta 10 000 caracteres.")]
    public required string Valor { get; set; }

    public DateTime? VenceEl { get; set; }
}

public class RevelarSecretoRequest
{
    // "revelado" (shown on screen) or "copiado" (copied to the clipboard).
    public string Accion { get; set; } = "revelado";
}

public class SecretoListItem
{
    public required int Id { get; set; }
    public required string Nombre { get; set; }
    public required string Tipo { get; set; }
    public int? EmpresaId { get; set; }
    public string? EmpresaNombre { get; set; }
    public string? Usuario { get; set; }
    public string? Url { get; set; }
    public DateTime? VenceEl { get; set; }
    public required DateTime RotadoAtUtc { get; set; }
    public required bool Restringido { get; set; }
}

public class AccesoSecretoResponse
{
    public required long Id { get; set; }
    public int? SecretoId { get; set; }
    public required string SecretoNombre { get; set; }
    public required string UsuarioNombre { get; set; }
    public required string Accion { get; set; }
    public string? Ip { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
}

public class SecretoResponse
{
    public required int Id { get; set; }
    public required string Nombre { get; set; }
    public required string Tipo { get; set; }
    public int? EmpresaId { get; set; }
    public string? EmpresaNombre { get; set; }
    public string? Usuario { get; set; }
    public string? Url { get; set; }
    public string? Notas { get; set; }
    public DateTime? VenceEl { get; set; }
    public required DateTime RotadoAtUtc { get; set; }
    public required bool Restringido { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
    public required List<AccesoSecretoResponse> Accesos { get; set; }
}

public class BovedaResumenResponse
{
    // False when the API has no master key: values can't be saved or shown.
    public required bool Configurada { get; set; }
    public required int Total { get; set; }
    public required int PorVencer { get; set; }
    public required int Vencidos { get; set; }
}
