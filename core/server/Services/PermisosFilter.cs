using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Server.Models;

namespace Server.Services;

// The module a controller (or one action) belongs to. Reading needs "ver"
// and anything else "editar", unless `nivel` says otherwise (revealing a
// secret is a POST that only needs to see the vault, say).
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class ModuloAttribute(string modulo, string? nivel = null) : Attribute
{
    public string Modulo { get; } = modulo;
    public string? Nivel { get; } = nivel;
}

// Admins only, checked against the database (not the token's role claim).
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class SoloAdminAttribute : Attribute;

// Runs before every API action of a signed-in user: the user must still
// exist and be active, and have the access the action's module asks for.
// The effective permissions stay in HttpContext for the action to use.
public class PermisosFilter(PermisosService permisos) : IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var metadata = context.ActionDescriptor.EndpointMetadata;
        if (metadata.OfType<IAllowAnonymous>().Any()) return;
        var http = context.HttpContext;
        if (http.User.Identity?.IsAuthenticated != true) return;

        if (!int.TryParse(http.User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId)
            || await permisos.ObtenerAsync(usuarioId, http.RequestAborted) is not { Activo: true } p)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Tu sesión ya no es válida. Vuelve a ingresar." });
            return;
        }
        http.Items[nameof(PermisosEfectivos)] = p;

        if (metadata.OfType<SoloAdminAttribute>().Any() && !p.EsAdmin)
        {
            context.Result = Prohibido("Solo un administrador puede hacer esto.");
            return;
        }

        // The action's attribute comes after the controller's.
        if (metadata.OfType<ModuloAttribute>().LastOrDefault() is { } modulo)
        {
            var lectura = HttpMethods.IsGet(http.Request.Method) || HttpMethods.IsHead(http.Request.Method);
            var nivel = modulo.Nivel ?? (lectura ? NivelAcceso.Ver : NivelAcceso.Editar);
            if (!p.Puede(modulo.Modulo, nivel))
                context.Result = Prohibido(nivel == NivelAcceso.Ver
                    ? $"No tienes acceso a {Models.Modulo.Label(modulo.Modulo)}."
                    : $"Tu acceso a {Models.Modulo.Label(modulo.Modulo)} es de solo lectura.");
        }
    }

    private static ObjectResult Prohibido(string message) => new(new { message }) { StatusCode = StatusCodes.Status403Forbidden };
}

public static class PermisosHttpExtensions
{
    // Set by PermisosFilter on every authenticated action.
    public static PermisosEfectivos Permisos(this HttpContext http) =>
        http.Items[nameof(PermisosEfectivos)] as PermisosEfectivos
        ?? throw new InvalidOperationException("PermisosFilter no se ejecutó para esta acción.");
}
