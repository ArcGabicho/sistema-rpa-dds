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
    LoginThrottle throttle,
    ILogger<AuthController> logger
) : ControllerBase
{
    [HttpPost("login")]
    [EnableRateLimiting(RateLimiting.Login)]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (throttle.Bloqueo(email) is { } espera)
        {
            logger.LogWarning("Inicio de sesión bloqueado para {Email} por intentos fallidos", email);
            await RateLimiting.WriteTooManyAsync(HttpContext, espera);
            return new EmptyResult();
        }

        var user = await db.AdminUsers.SingleOrDefaultAsync(u => u.Email == email);
        if (user is null || passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
        {
            throttle.Fallo(email);
            logger.LogWarning("Intento de inicio de sesión fallido para {Email}", email);
            return Unauthorized(new { message = "Correo o contraseña incorrectos." });
        }
        throttle.Exito(email);

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
