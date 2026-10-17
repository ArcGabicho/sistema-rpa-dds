using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

public class CreateUserRequest
{
    [Required(ErrorMessage = "Ingresa un correo."), EmailAddress(ErrorMessage = "Correo no válido."), MaxLength(256)]
    public required string Email { get; set; }

    [Required(ErrorMessage = "Define una contraseña temporal."), MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres."), MaxLength(128)]
    public required string Password { get; set; }

    [Required(ErrorMessage = "Ingresa el nombre completo."), MinLength(2, ErrorMessage = "Ingresa el nombre completo."), MaxLength(200)]
    public required string FullName { get; set; }

    [Required(ErrorMessage = "Elige un rol.")]
    public required string Role { get; set; }
}

public class UpdateUserRequest
{
    [MinLength(2, ErrorMessage = "Ingresa el nombre completo."), MaxLength(200)]
    public string? FullName { get; set; }

    public string? Role { get; set; }

    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres."), MaxLength(128)]
    public string? NewPassword { get; set; }

    public bool? Activo { get; set; }

    // The modules where this user differs from their role (module → level);
    // sending it replaces every adjustment, an empty one clears them.
    public Dictionary<string, string>? Permisos { get; set; }
}

public class CambiarClaveRequest
{
    [Required(ErrorMessage = "Ingresa tu contraseña actual."), MaxLength(128)]
    public required string Actual { get; set; }

    [Required(ErrorMessage = "Ingresa la nueva contraseña."), MinLength(8, ErrorMessage = "La nueva contraseña debe tener al menos 8 caracteres."), MaxLength(128)]
    public required string Nueva { get; set; }
}

// Filled in one place (UsersController.Llenar), so no `required` here.
public class UserResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Role { get; set; } = "";
    public bool Activo { get; set; }
    // Has adjustments over their role's preset.
    public bool Personalizado { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }
}

public class UserDetailResponse : UserResponse
{
    // module → level: the role's preset, this user's adjustments, and the result.
    public required Dictionary<string, string> PermisosRol { get; set; }
    public required Dictionary<string, string> PermisosPersonalizados { get; set; }
    public required Dictionary<string, string> PermisosEfectivos { get; set; }
}

public class RolResponse
{
    public required string Rol { get; set; }
    public required string Label { get; set; }
    public required Dictionary<string, string> Permisos { get; set; }
}

// Who is signed in and what they can do, for the panel's menu and buttons.
public class MeResponse
{
    public required int Id { get; set; }
    public required string Email { get; set; }
    public required string FullName { get; set; }
    public required string Role { get; set; }
    public required string RoleLabel { get; set; }
    public required bool EsAdmin { get; set; }
    public required Dictionary<string, string> Permisos { get; set; }
}
