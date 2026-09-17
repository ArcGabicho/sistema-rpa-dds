using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

public class CreateUserRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public required string Email { get; set; }

    [Required, MinLength(8), MaxLength(200)]
    public required string Password { get; set; }

    [Required, MinLength(2), MaxLength(200)]
    public required string FullName { get; set; }

    [Required]
    public required string Role { get; set; }
}

public class UpdateUserRequest
{
    [MinLength(2), MaxLength(200)]
    public string? FullName { get; set; }

    public string? Role { get; set; }

    [MinLength(8), MaxLength(200)]
    public string? NewPassword { get; set; }
}

public class UserResponse
{
    public required int Id { get; set; }
    public required string Email { get; set; }
    public required string FullName { get; set; }
    public required string Role { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }
}
