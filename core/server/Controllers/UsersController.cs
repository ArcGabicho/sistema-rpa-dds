using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(AppDbContext db, PasswordHasher<AdminUser> passwordHasher) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> GetAll()
    {
        var users = await db.AdminUsers.OrderBy(u => u.FullName).ToListAsync();
        return Ok(users.Select(ToResponse));
    }

    [HttpPost]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<ActionResult<UserResponse>> Create(CreateUserRequest request)
    {
        if (!AdminRole.All.Contains(request.Role))
            return BadRequest(new { message = $"Rol inválido. Usa uno de: {string.Join(", ", AdminRole.All)}." });

        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.AdminUsers.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "Ya existe un usuario con ese correo." });

        var user = new AdminUser
        {
            Email = email,
            FullName = request.FullName.Trim(),
            Role = request.Role,
            PasswordHash = string.Empty,
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        db.AdminUsers.Add(user);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), ToResponse(user));
    }

    [HttpPatch("{id:int}")]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<ActionResult<UserResponse>> Update(int id, UpdateUserRequest request)
    {
        var user = await db.AdminUsers.FindAsync(id);
        if (user is null) return NotFound();

        if (request.Role is not null && request.Role != user.Role)
        {
            if (!AdminRole.All.Contains(request.Role))
                return BadRequest(new { message = $"Rol inválido. Usa uno de: {string.Join(", ", AdminRole.All)}." });

            if (user.Role == AdminRole.Admin && request.Role != AdminRole.Admin && await IsLastAdminAsync(user.Id))
                return BadRequest(new { message = "No puedes quitarle el rol de Admin al último administrador." });

            user.Role = request.Role;
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
            user.FullName = request.FullName.Trim();

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
            user.PasswordHash = passwordHasher.HashPassword(user, request.NewPassword);

        await db.SaveChangesAsync();
        return Ok(ToResponse(user));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await db.AdminUsers.FindAsync(id);
        if (user is null) return NotFound();

        var currentUserId = await GetCurrentUserIdAsync();
        if (currentUserId == user.Id)
            return BadRequest(new { message = "No puedes eliminar tu propio usuario." });

        if (user.Role == AdminRole.Admin && await IsLastAdminAsync(user.Id))
            return BadRequest(new { message = "No puedes eliminar al último administrador." });

        db.AdminUsers.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> IsLastAdminAsync(int excludingUserId) =>
        !await db.AdminUsers.AnyAsync(u => u.Role == AdminRole.Admin && u.Id != excludingUserId);

    private async Task<int?> GetCurrentUserIdAsync()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
        if (email is null) return null;

        var user = await db.AdminUsers.SingleOrDefaultAsync(u => u.Email == email);
        return user?.Id;
    }

    private static UserResponse ToResponse(AdminUser user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName,
        Role = user.Role,
        CreatedAtUtc = user.CreatedAtUtc,
        LastLoginAtUtc = user.LastLoginAtUtc,
    };
}
