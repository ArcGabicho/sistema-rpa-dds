using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AppDbContext db,
    PasswordHasher<AdminUser> passwordHasher,
    TokenService tokenService,
    ILogger<AuthController> logger
) : ControllerBase
{
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.AdminUsers.SingleOrDefaultAsync(u => u.Email == email);

        if (user is null)
        {
            logger.LogWarning("Intento de inicio de sesión fallido para {Email}", email);
            return Unauthorized(new { message = "Correo o contraseña incorrectos." });
        }

        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            logger.LogWarning("Intento de inicio de sesión fallido para {Email}", email);
            return Unauthorized(new { message = "Correo o contraseña incorrectos." });
        }

        user.LastLoginAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var (token, expiresIn) = tokenService.CreateToken(user, request.RememberMe);

        return Ok(new LoginResponse
        {
            Token = token,
            ExpiresInSeconds = expiresIn,
            User = new AdminUserResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
            },
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AdminUserResponse>> Me()
    {
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value;
        var user = await db.AdminUsers.SingleOrDefaultAsync(u => u.Email == email);
        if (user is null) return Unauthorized();

        return Ok(new AdminUserResponse
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
        });
    }
}
