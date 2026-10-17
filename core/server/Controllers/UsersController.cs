using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

// The team: anyone can list it (to assign work); only admins manage it —
// roles, per-module adjustments, deactivation and passwords.
[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(AppDbContext db, PasswordHasher<AdminUser> passwordHasher, PermisosService permisos) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> GetAll(CancellationToken ct)
    {
        var users = await db.AdminUsers.Include(u => u.Permisos).OrderBy(u => u.FullName).AsSplitQuery().ToListAsync(ct);
        return Ok(users.Select(u => Llenar(new UserResponse(), u)));
    }

    [HttpGet("roles")]
    public ActionResult<List<RolResponse>> GetRoles() => Ok(AdminRole.All.Select(r => new RolResponse
    {
        Rol = r,
        Label = AdminRole.Label(r),
        Permisos = new Dictionary<string, string>(PermisosRol.De(r)),
    }).ToList());

    [HttpGet("{id:int}")]
    [SoloAdmin]
    public async Task<ActionResult<UserDetailResponse>> GetById(int id, CancellationToken ct)
    {
        var user = await db.AdminUsers.Include(u => u.Permisos).FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return NotFound();
        return Ok(ToDetail(user));
    }

    [HttpPost]
    [SoloAdmin]
    public async Task<ActionResult<UserResponse>> Create(CreateUserRequest request, CancellationToken ct)
    {
        if (!AdminRole.All.Contains(request.Role))
            return BadRequest(new { message = $"Rol inválido. Usa uno de: {string.Join(", ", AdminRole.All)}." });

        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.AdminUsers.AnyAsync(u => u.Email == email, ct))
            return Conflict(new { message = "Ya existe un usuario con ese correo." });

        var user = new AdminUser { Email = email, FullName = request.FullName.Trim(), Role = request.Role, PasswordHash = string.Empty };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
        db.AdminUsers.Add(user);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, Llenar(new UserResponse(), user));
    }

    [HttpPatch("{id:int}")]
    [SoloAdmin]
    public async Task<ActionResult<UserDetailResponse>> Update(int id, UpdateUserRequest request, CancellationToken ct)
    {
        var user = await db.AdminUsers.Include(u => u.Permisos).FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return NotFound();
        var propio = user.Id == HttpContext.Permisos().UsuarioId;

        if (request.Role is not null && request.Role != user.Role)
        {
            if (!AdminRole.All.Contains(request.Role))
                return BadRequest(new { message = $"Rol inválido. Usa uno de: {string.Join(", ", AdminRole.All)}." });
            if (user.Role == AdminRole.Admin && await EsUltimoAdminAsync(user.Id, ct))
                return BadRequest(new { message = "No puedes quitarle el rol de Admin al último administrador activo." });
            user.Role = request.Role;
        }

        if (request.Activo is { } activo && activo != user.Activo)
        {
            if (!activo && propio) return BadRequest(new { message = "No puedes desactivar tu propio usuario." });
            if (!activo && user.Role == AdminRole.Admin && await EsUltimoAdminAsync(user.Id, ct))
                return BadRequest(new { message = "No puedes desactivar al último administrador activo." });
            user.Activo = activo;
        }

        if (request.Permisos is { } ajustes)
        {
            foreach (var (modulo, nivel) in ajustes)
                if (!Modulo.All.Contains(modulo) || !NivelAcceso.All.Contains(nivel))
                    return BadRequest(new { message = $"Permiso inválido: {modulo} = {nivel}." });
            // Only what differs from the role is kept: changing the role later
            // doesn't leave stale copies of its old preset behind.
            var preset = PermisosRol.De(user.Role);
            db.PermisosUsuario.RemoveRange(user.Permisos);
            user.Permisos.Clear();
            if (user.Role != AdminRole.Admin)
                foreach (var (modulo, nivel) in ajustes.Where(a => preset[a.Key] != a.Value))
                    user.Permisos.Add(new PermisoUsuario { Modulo = modulo, Nivel = nivel });
        }
        else if (request.Role is not null)
        {
            // A new role: drop adjustments that now match its preset.
            var preset = PermisosRol.De(user.Role);
            foreach (var p in user.Permisos.Where(p => user.Role == AdminRole.Admin || preset[p.Modulo] == p.Nivel).ToList())
            {
                user.Permisos.Remove(p);
                db.PermisosUsuario.Remove(p);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.FullName)) user.FullName = request.FullName.Trim();
        if (!string.IsNullOrWhiteSpace(request.NewPassword)) user.PasswordHash = passwordHasher.HashPassword(user, request.NewPassword);

        await db.SaveChangesAsync(ct);
        permisos.Invalidar(user.Id);
        return Ok(ToDetail(user));
    }

    [HttpDelete("{id:int}")]
    [SoloAdmin]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var user = await db.AdminUsers.FindAsync([id], ct);
        if (user is null) return NotFound();
        if (user.Id == HttpContext.Permisos().UsuarioId)
            return BadRequest(new { message = "No puedes eliminar tu propio usuario." });
        if (user.Role == AdminRole.Admin && await EsUltimoAdminAsync(user.Id, ct))
            return BadRequest(new { message = "No puedes eliminar al último administrador activo." });

        db.AdminUsers.Remove(user);
        await db.SaveChangesAsync(ct);
        permisos.Invalidar(id);
        return NoContent();
    }

    private async Task<bool> EsUltimoAdminAsync(int excepto, CancellationToken ct) =>
        !await db.AdminUsers.AnyAsync(u => u.Role == AdminRole.Admin && u.Activo && u.Id != excepto, ct);

    private static T Llenar<T>(T r, AdminUser u) where T : UserResponse
    {
        r.Id = u.Id;
        r.Email = u.Email;
        r.FullName = u.FullName;
        r.Role = u.Role;
        r.Activo = u.Activo;
        r.Personalizado = u.Role != AdminRole.Admin && u.Permisos.Count > 0;
        r.CreatedAtUtc = u.CreatedAtUtc;
        r.LastLoginAtUtc = u.LastLoginAtUtc;
        return r;
    }

    private static UserDetailResponse ToDetail(AdminUser u) => Llenar(new UserDetailResponse
    {
        PermisosRol = new Dictionary<string, string>(PermisosRol.De(u.Role)),
        PermisosPersonalizados = u.Role == AdminRole.Admin ? [] : u.Permisos.ToDictionary(p => p.Modulo, p => p.Nivel),
        PermisosEfectivos = new Dictionary<string, string>(PermisosEfectivos.De(u).Modulos),
    }, u);
}
