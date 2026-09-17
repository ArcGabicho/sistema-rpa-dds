using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

public class LoginRequest
{
    [Required, EmailAddress]
    public required string Email { get; set; }

    [Required]
    public required string Password { get; set; }

    public bool RememberMe { get; set; }
}

public class LoginResponse
{
    public required string Token { get; set; }
    public required int ExpiresInSeconds { get; set; }
    public required AdminUserResponse User { get; set; }
}

public class AdminUserResponse
{
    public required int Id { get; set; }
    public required string Email { get; set; }
    public required string FullName { get; set; }
    public required string Role { get; set; }
}
