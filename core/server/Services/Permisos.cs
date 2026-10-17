using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Server.Data;
using Server.Models;

namespace Server.Services;

// What each role can do by default, module by module. An admin can raise
// or lower any module for one user (PermisoUsuario); admins always have
// everything, plus users, deletions, restricted secrets and the vault log.
public static class PermisosRol
{
    private static readonly Dictionary<string, Dictionary<string, string>> Presets = new()
    {
        [AdminRole.Comercial] = new()
        {
            [Modulo.Comercial] = NivelAcceso.Editar,
            [Modulo.Diagnosticos] = NivelAcceso.Editar,
            [Modulo.Propuestas] = NivelAcceso.Editar,
            [Modulo.Proyectos] = NivelAcceso.Ver,
            [Modulo.Boveda] = NivelAcceso.Ninguno,
            [Modulo.Operacion] = NivelAcceso.Ver,
        },
        [AdminRole.Consultor] = new()
        {
            [Modulo.Comercial] = NivelAcceso.Ver,
            [Modulo.Diagnosticos] = NivelAcceso.Editar,
            [Modulo.Propuestas] = NivelAcceso.Ver,
            [Modulo.Proyectos] = NivelAcceso.Editar,
            [Modulo.Boveda] = NivelAcceso.Editar,
            [Modulo.Operacion] = NivelAcceso.Ver,
        },
        [AdminRole.Soporte] = new()
        {
            [Modulo.Comercial] = NivelAcceso.Ver,
            [Modulo.Diagnosticos] = NivelAcceso.Ninguno,
            [Modulo.Propuestas] = NivelAcceso.Ninguno,
            [Modulo.Proyectos] = NivelAcceso.Ver,
            [Modulo.Boveda] = NivelAcceso.Editar,
            [Modulo.Operacion] = NivelAcceso.Editar,
        },
    };

    public static IReadOnlyDictionary<string, string> De(string rol) =>
        rol == AdminRole.Admin
            ? Modulo.All.ToDictionary(m => m, _ => NivelAcceso.Editar)
            : Presets.TryGetValue(rol, out var p) ? p : Modulo.All.ToDictionary(m => m, _ => NivelAcceso.Ninguno);
}

// A signed-in user's effective access: their role's preset with their own
// adjustments on top.
public sealed record PermisosEfectivos(int UsuarioId, string Rol, bool Activo, IReadOnlyDictionary<string, string> Modulos)
{
    public bool EsAdmin => Rol == AdminRole.Admin;

    public string Nivel(string modulo) => EsAdmin ? NivelAcceso.Editar : Modulos.GetValueOrDefault(modulo, NivelAcceso.Ninguno);

    public bool Puede(string modulo, string nivel) => NivelAcceso.Rango(Nivel(modulo)) >= NivelAcceso.Rango(nivel);

    public static PermisosEfectivos De(AdminUser u)
    {
        var modulos = new Dictionary<string, string>(PermisosRol.De(u.Role));
        if (u.Role != AdminRole.Admin)
            foreach (var p in u.Permisos.Where(p => Modulo.All.Contains(p.Modulo) && NivelAcceso.All.Contains(p.Nivel)))
                modulos[p.Modulo] = p.Nivel;
        return new PermisosEfectivos(u.Id, u.Role, u.Activo, modulos);
    }
}

// Reads them from the database rather than the token, so a change of role
// or permissions — or a deactivation — applies at once instead of when the
// session expires. Cached for 30 seconds per user; changes made here clear
// it (another API instance would pick them up when its copy expires).
public class PermisosService(AppDbContext db, IMemoryCache cache)
{
    private static readonly TimeSpan Duracion = TimeSpan.FromSeconds(30);

    public async Task<PermisosEfectivos?> ObtenerAsync(int usuarioId, CancellationToken ct = default)
    {
        if (cache.TryGetValue(Clave(usuarioId), out PermisosEfectivos? guardado)) return guardado;

        var usuario = await db.AdminUsers.AsNoTracking().Include(u => u.Permisos).FirstOrDefaultAsync(u => u.Id == usuarioId, ct);
        var permisos = usuario is null ? null : PermisosEfectivos.De(usuario);
        cache.Set(Clave(usuarioId), permisos, Duracion);
        return permisos;
    }

    public void Invalidar(int usuarioId) => cache.Remove(Clave(usuarioId));

    private static string Clave(int usuarioId) => $"permisos:{usuarioId}";
}
