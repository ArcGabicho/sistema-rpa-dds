using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

// The vault. Listing and metadata never include a value; a value only leaves
// through POST {id}/revelar, which is rate-limited and logged. Restricted
// secrets can only be revealed, rotated or edited by an admin.
[ApiController]
[Route("api/boveda")]
[Authorize]
[Modulo(Modulo.Boveda)]
public class BovedaController(AppDbContext db, BovedaCifrado cifrado) : ControllerBase
{
    // How far ahead an expiry counts as "por vencer".
    private const int DiasAviso = 30;

    [HttpGet("resumen")]
    public async Task<ActionResult<BovedaResumenResponse>> GetResumen(CancellationToken ct)
    {
        var hoy = Lima.Hoy;
        var limite = hoy.AddDays(DiasAviso);
        return Ok(new BovedaResumenResponse
        {
            Configurada = cifrado.Configurada,
            Total = await db.Secretos.CountAsync(ct),
            PorVencer = await db.Secretos.CountAsync(s => s.VenceEl >= hoy && s.VenceEl <= limite, ct),
            Vencidos = await db.Secretos.CountAsync(s => s.VenceEl < hoy, ct),
        });
    }

    // estado: "vencido", "por_vencer" (within 30 days) or "vigente".
    // soloDds: only DDS's own secrets (no company).
    [HttpGet]
    public async Task<ActionResult<PagedResponse<SecretoListItem>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] int? empresaId,
        [FromQuery] bool soloDds = false,
        [FromQuery] string? tipo = null,
        [FromQuery] string? estado = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var hoy = Lima.Hoy;
        var limite = hoy.AddDays(DiasAviso);

        var query = db.Secretos.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(s =>
                s.Nombre.Contains(term)
                || (s.Usuario != null && s.Usuario.Contains(term))
                || (s.Url != null && s.Url.Contains(term))
                || (s.Empresa != null && s.Empresa.NombreComercial.Contains(term)));
        }
        if (soloDds) query = query.Where(s => s.EmpresaId == null);
        else if (empresaId.HasValue) query = query.Where(s => s.EmpresaId == empresaId);
        if (!string.IsNullOrWhiteSpace(tipo)) query = query.Where(s => s.Tipo == tipo);
        query = estado switch
        {
            "vencido" => query.Where(s => s.VenceEl < hoy),
            "por_vencer" => query.Where(s => s.VenceEl >= hoy && s.VenceEl <= limite),
            "vigente" => query.Where(s => s.VenceEl == null || s.VenceEl > limite),
            _ => query,
        };

        // Grouped by company, DDS's own first (no company sorts first).
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(s => s.Empresa != null ? s.Empresa.NombreComercial : null)
            .ThenBy(s => s.Nombre)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SecretoListItem
            {
                Id = s.Id,
                Nombre = s.Nombre,
                Tipo = s.Tipo,
                EmpresaId = s.EmpresaId,
                EmpresaNombre = s.Empresa != null ? s.Empresa.NombreComercial : null,
                Usuario = s.Usuario,
                Url = s.Url,
                VenceEl = s.VenceEl,
                RotadoAtUtc = s.RotadoAtUtc,
                Restringido = s.Restringido,
            })
            .ToListAsync(ct);

        return Ok(PagedResponse<SecretoListItem>.Create(items, page, pageSize, totalCount));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SecretoResponse>> GetById(int id, CancellationToken ct)
    {
        var s = await db.Secretos.AsNoTracking().Include(x => x.Empresa).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (s is null) return NotFound();

        var accesos = await db.AccesosSecreto
            .AsNoTracking()
            .Where(a => a.SecretoId == id)
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(50)
            .Select(ToAcceso)
            .ToListAsync(ct);

        return Ok(new SecretoResponse
        {
            Id = s.Id,
            Nombre = s.Nombre,
            Tipo = s.Tipo,
            EmpresaId = s.EmpresaId,
            EmpresaNombre = s.Empresa?.NombreComercial,
            Usuario = s.Usuario,
            Url = s.Url,
            Notas = s.Notas,
            VenceEl = s.VenceEl,
            RotadoAtUtc = s.RotadoAtUtc,
            Restringido = s.Restringido,
            CreatedAtUtc = s.CreatedAtUtc,
            Accesos = accesos,
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateSecretoRequest request, CancellationToken ct)
    {
        if (!cifrado.Configurada) return SinClave();
        var error = await ValidateAsync(request, ct);
        if (error is not null) return error;

        var secreto = new Secreto { Nombre = "", Tipo = request.Tipo, ValorCifrado = [] };
        Apply(secreto, request);
        secreto.ValorCifrado = cifrado.Cifrar(request.Valor, secreto.Uid);
        db.Secretos.Add(secreto);
        await RegistrarAsync(secreto, SecretoAccion.Creado, ct);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = secreto.Id }, new { id = secreto.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, SecretoMetadataRequest request, CancellationToken ct)
    {
        var secreto = await db.Secretos.FindAsync([id], ct);
        if (secreto is null) return NotFound();
        if ((secreto.Restringido || request.Restringido != secreto.Restringido) && !EsAdmin()) return SoloAdmin();

        var error = await ValidateAsync(request, ct);
        if (error is not null) return error;

        Apply(secreto, request);
        secreto.UpdatedAtUtc = DateTime.UtcNow;
        await RegistrarAsync(secreto, SecretoAccion.Editado, ct);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPut("{id:int}/valor")]
    public async Task<IActionResult> Rotar(int id, RotarSecretoRequest request, CancellationToken ct)
    {
        if (!cifrado.Configurada) return SinClave();
        var secreto = await db.Secretos.FindAsync([id], ct);
        if (secreto is null) return NotFound();
        if (secreto.Restringido && !EsAdmin()) return SoloAdmin();

        secreto.ValorCifrado = cifrado.Cifrar(request.Valor, secreto.Uid);
        secreto.VenceEl = request.VenceEl?.Date;
        secreto.RotadoAtUtc = secreto.UpdatedAtUtc = DateTime.UtcNow;
        await RegistrarAsync(secreto, SecretoAccion.Rotado, ct);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:int}/revelar")]
    [Modulo(Modulo.Boveda, NivelAcceso.Ver)]
    [EnableRateLimiting(RateLimiting.Boveda)]
    public async Task<IActionResult> Revelar(int id, RevelarSecretoRequest request, CancellationToken ct)
    {
        if (!cifrado.Configurada) return SinClave();
        var secreto = await db.Secretos.FindAsync([id], ct);
        if (secreto is null) return NotFound();
        if (secreto.Restringido && !EsAdmin()) return SoloAdmin();

        string valor;
        try
        {
            valor = cifrado.Descifrar(secreto.ValorCifrado, secreto.Uid);
        }
        catch (CryptographicException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = "No se pudo descifrar el valor: la clave maestra de la bóveda no es la que lo cifró.",
            });
        }

        await RegistrarAsync(secreto, request.Accion == SecretoAccion.Copiado ? SecretoAccion.Copiado : SecretoAccion.Revelado, ct);
        await db.SaveChangesAsync(ct);

        Response.Headers.CacheControl = "no-store";
        return Ok(new { valor });
    }

    [HttpDelete("{id:int}")]
    [SoloAdmin]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var secreto = await db.Secretos.FindAsync([id], ct);
        if (secreto is null) return NotFound();

        // Logged before the delete (to read the company) and without the link,
        // which the delete nulls out anyway.
        var nombre = secreto.EmpresaId is null
            ? secreto.Nombre
            : $"{secreto.Nombre} · {await db.Empresas.Where(e => e.Id == secreto.EmpresaId).Select(e => e.NombreComercial).SingleAsync(ct)}";
        db.Secretos.Remove(secreto);
        await RegistrarAsync(null, SecretoAccion.Eliminado, ct, nombre);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // The vault's whole audit trail, deleted secrets included.
    [HttpGet("accesos")]
    [SoloAdmin]
    public async Task<ActionResult<PagedResponse<AccesoSecretoResponse>>> GetAccesos(
        [FromQuery] string? accion,
        [FromQuery] int? usuarioId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.AccesosSecreto.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(accion)) query = query.Where(a => a.Accion == accion);
        if (usuarioId.HasValue) query = query.Where(a => a.UsuarioId == usuarioId);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(a => a.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToAcceso)
            .ToListAsync(ct);
        return Ok(PagedResponse<AccesoSecretoResponse>.Create(items, page, pageSize, totalCount));
    }

    private static readonly System.Linq.Expressions.Expression<Func<AccesoSecreto, AccesoSecretoResponse>> ToAcceso = a => new AccesoSecretoResponse
    {
        Id = a.Id,
        SecretoId = a.SecretoId,
        SecretoNombre = a.SecretoNombre,
        UsuarioNombre = a.UsuarioNombre,
        Accion = a.Accion,
        Ip = a.Ip,
        CreatedAtUtc = a.CreatedAtUtc,
    };

    private async Task RegistrarAsync(Secreto? secreto, string accion, CancellationToken ct, string? nombre = null)
    {
        var usuarioId = await db.GetCurrentUserIdAsync(User, ct);
        var usuarioNombre = usuarioId is null
            ? "Desconocido"
            : await db.AdminUsers.Where(u => u.Id == usuarioId).Select(u => u.FullName).SingleAsync(ct);

        // The log names the secret with its company, so a row still reads
        // right once the secret (or the company) is gone.
        var empresaId = secreto?.EmpresaId;
        var empresa = empresaId is null
            ? null
            : await db.Empresas.Where(e => e.Id == empresaId).Select(e => e.NombreComercial).SingleOrDefaultAsync(ct);
        var secretoNombre = secreto?.Nombre ?? nombre ?? "—";

        db.AccesosSecreto.Add(new AccesoSecreto
        {
            Secreto = secreto,
            SecretoNombre = empresa is null ? secretoNombre : $"{secretoNombre} · {empresa}",
            UsuarioId = usuarioId,
            UsuarioNombre = usuarioNombre,
            Accion = accion,
            Ip = ClientIp.Resolve(HttpContext),
        });
    }

    private async Task<ActionResult?> ValidateAsync(SecretoMetadataRequest request, CancellationToken ct)
    {
        if (!SecretoTipo.All.Contains(request.Tipo))
            return BadRequest(new { message = $"Tipo inválido. Usa uno de: {string.Join(", ", SecretoTipo.All)}." });
        if (request.EmpresaId.HasValue && !await db.Empresas.AnyAsync(e => e.Id == request.EmpresaId, ct))
            return BadRequest(new { message = "La empresa no existe." });
        return null;
    }

    private static void Apply(Secreto secreto, SecretoMetadataRequest request)
    {
        secreto.Nombre = request.Nombre.Trim();
        secreto.Tipo = request.Tipo;
        secreto.EmpresaId = request.EmpresaId;
        secreto.Usuario = Normalize(request.Usuario);
        secreto.Url = Normalize(request.Url);
        secreto.Notas = Normalize(request.Notas);
        secreto.VenceEl = request.VenceEl?.Date;
        secreto.Restringido = request.Restringido;
    }

    private bool EsAdmin() => HttpContext.Permisos().EsAdmin;

    private ObjectResult SoloAdmin() => StatusCode(StatusCodes.Status403Forbidden, new
    {
        message = "Esta credencial está restringida: solo un administrador puede verla o cambiarla.",
    });

    private ObjectResult SinClave() => StatusCode(StatusCodes.Status503ServiceUnavailable, new
    {
        message = "La bóveda no está configurada: falta la clave maestra (BOVEDA_CLAVE_MAESTRA) en el servidor.",
    });

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
