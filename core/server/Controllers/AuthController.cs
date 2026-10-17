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
    PermisosService permisos,
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
        // Checked after the password, so it doesn't reveal which accounts exist.
        if (!user.Activo)
            return Unauthorized(new { message = "Tu usuario está desactivado. Pide a un administrador que lo reactive." });

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

    // The signed-in user and their effective permissions (PermisosFilter has
    // already checked they exist and are active).
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<MeResponse>> Me(CancellationToken ct)
    {
        var p = HttpContext.Permisos();
        var user = await db.AdminUsers.AsNoTracking().FirstAsync(u => u.Id == p.UsuarioId, ct);
        return Ok(new MeResponse
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            RoleLabel = AdminRole.Label(user.Role),
            EsAdmin = p.EsAdmin,
            Permisos = Modulo.All.ToDictionary(m => m, p.Nivel),
        });
    }

    // Changing one's own password needs the current one. Limited like the
    // login, since it also tells whether a password is right.
    [HttpPost("clave")]
    [Authorize]
    [EnableRateLimiting(RateLimiting.Login)]
    public async Task<IActionResult> CambiarClave(CambiarClaveRequest request, CancellationToken ct)
    {
        var user = await db.AdminUsers.FirstAsync(u => u.Id == HttpContext.Permisos().UsuarioId, ct);
        if (passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Actual) == PasswordVerificationResult.Failed)
            return BadRequest(new { message = "La contraseña actual no es correcta." });
        if (request.Actual == request.Nueva)
            return BadRequest(new { message = "La nueva contraseña debe ser distinta de la actual." });

        user.PasswordHash = passwordHasher.HashPassword(user, request.Nueva);
        await db.SaveChangesAsync(ct);
        permisos.Invalidar(user.Id);
        logger.LogInformation("{Email} cambió su contraseña", user.Email);
        return NoContent();
    }
}
