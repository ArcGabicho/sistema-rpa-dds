using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/empresas")]
[Authorize]
[Modulo(Modulo.Comercial)]
public class EmpresasController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResponse<EmpresaListItem>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? estado,
        [FromQuery] int? responsableId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Empresas.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(e =>
                e.NombreComercial.Contains(term)
                || (e.RazonSocial != null && e.RazonSocial.Contains(term))
                || (e.Ruc != null && e.Ruc.StartsWith(term)));
        }
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(e => e.Estado == estado);
        if (responsableId.HasValue) query = query.Where(e => e.ResponsableId == responsableId);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(e => e.NombreComercial)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EmpresaListItem
            {
                Id = e.Id,
                NombreComercial = e.NombreComercial,
                RazonSocial = e.RazonSocial,
                Ruc = e.Ruc,
                Rubro = e.Rubro,
                Provincia = e.Provincia,
                Estado = e.Estado,
                ResponsableNombre = e.Responsable != null ? e.Responsable.FullName : null,
                ContactosCount = e.Contactos.Count,
                OportunidadesAbiertas = e.Oportunidades.Count(o => OportunidadEtapa.Abiertas.Contains(o.Etapa)),
            })
            .ToListAsync(ct);

        return Ok(PagedResponse<EmpresaListItem>.Create(items, page, pageSize, totalCount));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmpresaResponse>> GetById(int id, CancellationToken ct)
    {
        var empresa = await db.Empresas
            .AsNoTracking()
            .Include(e => e.Responsable)
            .Include(e => e.Contactos.OrderBy(c => c.Nombres))
            .FirstOrDefaultAsync(e => e.Id == id, ct);
        if (empresa is null) return NotFound();

        var oportunidades = await db.Oportunidades
            .AsNoTracking()
            .Where(o => o.EmpresaId == id)
            .OrderByDescending(o => o.UpdatedAtUtc)
            .Select(ComercialMapping.ToListItem)
            .ToListAsync(ct);

        var actividades = await db.Actividades
            .AsNoTracking()
            .Where(a => a.EmpresaId == id)
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(50)
            .Select(ComercialMapping.ToActividad)
            .ToListAsync(ct);

        return Ok(new EmpresaResponse
        {
            Id = empresa.Id,
            NombreComercial = empresa.NombreComercial,
            RazonSocial = empresa.RazonSocial,
            Ruc = empresa.Ruc,
            Rubro = empresa.Rubro,
            SitioWeb = empresa.SitioWeb,
            Direccion = empresa.Direccion,
            Distrito = empresa.Distrito,
            Provincia = empresa.Provincia,
            Estado = empresa.Estado,
            Origen = empresa.Origen,
            ResponsableId = empresa.ResponsableId,
            ResponsableNombre = empresa.Responsable?.FullName,
            CreatedAtUtc = empresa.CreatedAtUtc,
            Contactos = empresa.Contactos.Select(ComercialMapping.ToContacto).ToList(),
            Oportunidades = oportunidades,
            Actividades = actividades,
        });
    }

    [HttpPost]
    public async Task<ActionResult<EmpresaResponse>> Create(EmpresaRequest request, CancellationToken ct)
    {
        var error = await ValidateAsync(request, null, ct);
        if (error is not null) return error;

        var empresa = new Empresa { NombreComercial = "", Estado = EmpresaEstado.Prospecto };
        Apply(empresa, request);
        db.Empresas.Add(empresa);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = empresa.Id }, new { id = empresa.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, EmpresaRequest request, CancellationToken ct)
    {
        var empresa = await db.Empresas.FindAsync([id], ct);
        if (empresa is null) return NotFound();

        var error = await ValidateAsync(request, id, ct);
        if (error is not null) return error;

        Apply(empresa, request);
        empresa.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [SoloAdmin]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var empresa = await db.Empresas.FindAsync([id], ct);
        if (empresa is null) return NotFound();

        db.Empresas.Remove(empresa);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:int}/contactos")]
    public async Task<ActionResult<ContactoResponse>> AddContacto(int id, ContactoRequest request, CancellationToken ct)
    {
        if (!await db.Empresas.AnyAsync(e => e.Id == id, ct)) return NotFound();

        var contacto = new Contacto { EmpresaId = id, Nombres = "" };
        ContactosController.Apply(contacto, request);
        db.Contactos.Add(contacto);
        await db.SaveChangesAsync(ct);

        return Ok(ComercialMapping.ToContacto(contacto));
    }

    [HttpPost("{id:int}/actividades")]
    public async Task<ActionResult<ActividadResponse>> AddActividad(int id, CreateActividadRequest request, CancellationToken ct)
    {
        if (!ActividadTipo.Manuales.Contains(request.Tipo))
            return BadRequest(new { message = $"Tipo inválido. Usa uno de: {string.Join(", ", ActividadTipo.Manuales)}." });
        if (!await db.Empresas.AnyAsync(e => e.Id == id, ct)) return NotFound();

        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();

        var actividad = new Actividad
        {
            EmpresaId = id,
            Tipo = request.Tipo,
            Descripcion = request.Descripcion.Trim(),
            AutorId = autorId.Value,
        };
        db.Actividades.Add(actividad);
        await db.SaveChangesAsync(ct);

        return Ok(await db.Actividades.Where(a => a.Id == actividad.Id).Select(ComercialMapping.ToActividad).SingleAsync(ct));
    }

    private async Task<ActionResult?> ValidateAsync(EmpresaRequest request, int? currentId, CancellationToken ct)
    {
        if (request.Estado is not null && !EmpresaEstado.All.Contains(request.Estado))
            return BadRequest(new { message = $"Estado inválido. Usa uno de: {string.Join(", ", EmpresaEstado.All)}." });

        var ruc = Normalize(request.Ruc);
        if (ruc is not null)
        {
            if (!Ruc.IsValid(ruc))
                return BadRequest(new { message = "El RUC no es válido: revisa el dígito verificador." });
            if (await db.Empresas.AnyAsync(e => e.Ruc == ruc && e.Id != currentId, ct))
                return Conflict(new { message = "Ya existe una empresa con ese RUC." });
        }

        if (request.ResponsableId.HasValue && !await db.AdminUsers.AnyAsync(u => u.Id == request.ResponsableId, ct))
            return BadRequest(new { message = "El responsable no existe." });

        return null;
    }

    private static void Apply(Empresa empresa, EmpresaRequest request)
    {
        empresa.NombreComercial = request.NombreComercial.Trim();
        empresa.RazonSocial = Normalize(request.RazonSocial);
        empresa.Ruc = Normalize(request.Ruc);
        empresa.Rubro = Normalize(request.Rubro);
        empresa.SitioWeb = Normalize(request.SitioWeb);
        empresa.Direccion = Normalize(request.Direccion);
        empresa.Distrito = Normalize(request.Distrito);
        empresa.Provincia = Normalize(request.Provincia);
        empresa.Estado = request.Estado ?? empresa.Estado;
        empresa.Origen = Normalize(request.Origen) ?? empresa.Origen;
        empresa.ResponsableId = request.ResponsableId;
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
