using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/oportunidades")]
[Authorize]
public class OportunidadesController(AppDbContext db) : ControllerBase
{
    // etapa: one stage, or "abiertas" for every stage still in play.
    [HttpGet]
    public async Task<ActionResult<PagedResponse<OportunidadListItem>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? etapa,
        [FromQuery] int? responsableId,
        [FromQuery] int? empresaId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = db.Oportunidades.AsNoTracking();
        if (etapa == "abiertas") query = query.Where(o => OportunidadEtapa.Abiertas.Contains(o.Etapa));
        else if (!string.IsNullOrWhiteSpace(etapa)) query = query.Where(o => o.Etapa == etapa);
        if (responsableId.HasValue) query = query.Where(o => o.ResponsableId == responsableId);
        if (empresaId.HasValue) query = query.Where(o => o.EmpresaId == empresaId);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(o => o.Titulo.Contains(term) || (o.Empresa != null && o.Empresa.NombreComercial.Contains(term)));
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(o => o.UpdatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ComercialMapping.ToListItem)
            .ToListAsync(ct);

        return Ok(PagedResponse<OportunidadListItem>.Create(items, page, pageSize, totalCount));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OportunidadResponse>> GetById(int id, CancellationToken ct)
    {
        var o = await db.Oportunidades
            .AsNoTracking()
            .Include(x => x.Empresa)
            .Include(x => x.Contacto)
            .Include(x => x.Responsable)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (o is null) return NotFound();

        var contactos = await db.Contactos
            .AsNoTracking()
            .Where(c => c.EmpresaId == o.EmpresaId)
            .OrderBy(c => c.Nombres)
            .ToListAsync(ct);

        var actividades = await db.Actividades
            .AsNoTracking()
            .Where(a => a.OportunidadId == id)
            .OrderByDescending(a => a.CreatedAtUtc)
            .Select(ComercialMapping.ToActividad)
            .ToListAsync(ct);

        return Ok(new OportunidadResponse
        {
            Id = o.Id,
            Titulo = o.Titulo,
            EmpresaId = o.EmpresaId,
            EmpresaNombre = o.Empresa?.NombreComercial ?? "—",
            ContactoId = o.ContactoId,
            ContactoNombre = o.Contacto is null ? null : $"{o.Contacto.Nombres} {o.Contacto.Apellidos}".Trim(),
            Servicio = o.Servicio,
            Etapa = o.Etapa,
            ValorEstimado = o.ValorEstimado,
            FechaCierreEstimada = o.FechaCierreEstimada,
            ResponsableId = o.ResponsableId,
            ResponsableNombre = o.Responsable?.FullName,
            ProximaAccion = o.ProximaAccion,
            ProximaAccionFecha = o.ProximaAccionFecha,
            MotivoPerdida = o.MotivoPerdida,
            CerradaAtUtc = o.CerradaAtUtc,
            SolicitudId = o.SolicitudId,
            CreatedAtUtc = o.CreatedAtUtc,
            ContactosEmpresa = contactos.Select(ComercialMapping.ToContacto).ToList(),
            Actividades = actividades,
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateOportunidadRequest request, CancellationToken ct)
    {
        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();

        var etapa = request.Etapa ?? OportunidadEtapa.Nuevo;
        var error = await ValidateAsync(request.EmpresaId, request.ContactoId, request.Servicio, etapa, request.ResponsableId, ct);
        if (error is not null) return error;

        var oportunidad = new Oportunidad
        {
            EmpresaId = request.EmpresaId,
            ContactoId = request.ContactoId,
            Titulo = request.Titulo.Trim(),
            Servicio = request.Servicio,
            Etapa = etapa,
            ValorEstimado = request.ValorEstimado,
            FechaCierreEstimada = request.FechaCierreEstimada,
            ResponsableId = request.ResponsableId ?? autorId,
            ProximaAccion = Normalize(request.ProximaAccion),
            ProximaAccionFecha = request.ProximaAccionFecha,
            CerradaAtUtc = OportunidadEtapa.Abiertas.Contains(etapa) ? null : DateTime.UtcNow,
        };
        db.Oportunidades.Add(oportunidad);
        await db.SaveChangesAsync(ct);

        db.Actividades.Add(new Actividad
        {
            EmpresaId = oportunidad.EmpresaId,
            OportunidadId = oportunidad.Id,
            Tipo = ActividadTipo.Nota,
            Descripcion = $"Oportunidad creada en la etapa {OportunidadEtapa.Label(etapa)}.",
            AutorId = autorId.Value,
        });
        await Embudo.MarcarClienteSiGanadaAsync(db, oportunidad, ct);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = oportunidad.Id }, new { id = oportunidad.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateOportunidadRequest request, CancellationToken ct)
    {
        var oportunidad = await db.Oportunidades.FindAsync([id], ct);
        if (oportunidad is null) return NotFound();

        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();

        var error = await ValidateAsync(oportunidad.EmpresaId, request.ContactoId, request.Servicio, request.Etapa, request.ResponsableId, ct);
        if (error is not null) return error;

        oportunidad.Titulo = request.Titulo.Trim();
        oportunidad.Servicio = request.Servicio;
        oportunidad.ValorEstimado = request.ValorEstimado;
        oportunidad.FechaCierreEstimada = request.FechaCierreEstimada;
        oportunidad.ContactoId = request.ContactoId;
        oportunidad.ResponsableId = request.ResponsableId;
        oportunidad.ProximaAccion = Normalize(request.ProximaAccion);
        oportunidad.ProximaAccionFecha = request.ProximaAccionFecha;
        await Embudo.CambiarEtapaAsync(db, oportunidad, request.Etapa, request.MotivoPerdida, autorId, ct);

        oportunidad.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("{id:int}/etapa")]
    public async Task<IActionResult> CambiarEtapa(int id, CambiarEtapaRequest request, CancellationToken ct)
    {
        if (!OportunidadEtapa.All.Contains(request.Etapa))
            return BadRequest(new { message = $"Etapa inválida. Usa una de: {string.Join(", ", OportunidadEtapa.All)}." });

        var oportunidad = await db.Oportunidades.FindAsync([id], ct);
        if (oportunidad is null) return NotFound();

        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();

        await Embudo.CambiarEtapaAsync(db, oportunidad, request.Etapa, request.MotivoPerdida, autorId, ct);
        oportunidad.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("{id:int}/proxima-accion")]
    public async Task<IActionResult> CambiarProximaAccion(int id, ProximaAccionRequest request, CancellationToken ct)
    {
        var oportunidad = await db.Oportunidades.FindAsync([id], ct);
        if (oportunidad is null) return NotFound();

        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();

        if (request.CompletarAnterior && oportunidad.ProximaAccion is not null)
        {
            db.Actividades.Add(new Actividad
            {
                EmpresaId = oportunidad.EmpresaId,
                OportunidadId = id,
                Tipo = ActividadTipo.Nota,
                Descripcion = $"Hecho: {oportunidad.ProximaAccion}",
                AutorId = autorId.Value,
            });
        }

        oportunidad.ProximaAccion = Normalize(request.ProximaAccion);
        oportunidad.ProximaAccionFecha = oportunidad.ProximaAccion is null ? null : request.ProximaAccionFecha;
        oportunidad.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:int}/actividades")]
    public async Task<ActionResult<ActividadResponse>> AddActividad(int id, CreateActividadRequest request, CancellationToken ct)
    {
        if (!ActividadTipo.Manuales.Contains(request.Tipo))
            return BadRequest(new { message = $"Tipo inválido. Usa uno de: {string.Join(", ", ActividadTipo.Manuales)}." });

        var oportunidad = await db.Oportunidades.FindAsync([id], ct);
        if (oportunidad is null) return NotFound();

        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();

        var actividad = new Actividad
        {
            EmpresaId = oportunidad.EmpresaId,
            OportunidadId = id,
            Tipo = request.Tipo,
            Descripcion = request.Descripcion.Trim(),
            AutorId = autorId.Value,
        };
        db.Actividades.Add(actividad);
        oportunidad.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(await db.Actividades.Where(a => a.Id == actividad.Id).Select(ComercialMapping.ToActividad).SingleAsync(ct));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var oportunidad = await db.Oportunidades.Include(o => o.Actividades).FirstOrDefaultAsync(o => o.Id == id, ct);
        if (oportunidad is null) return NotFound();

        // Activities cascade on the client side (ClientCascade): they're loaded
        // above so EF deletes them along with the opportunity. Diagnoses and
        // proposals stay with the company, unlinked (their FKs are NoAction).
        await db.Diagnosticos
            .Where(d => d.OportunidadId == id)
            .ExecuteUpdateAsync(set => set.SetProperty(d => d.OportunidadId, (int?)null), ct);
        await db.Propuestas
            .Where(p => p.OportunidadId == id)
            .ExecuteUpdateAsync(set => set.SetProperty(p => p.OportunidadId, (int?)null), ct);
        db.Oportunidades.Remove(oportunidad);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<ActionResult?> ValidateAsync(int empresaId, int? contactoId, string servicio, string etapa, int? responsableId, CancellationToken ct)
    {
        if (!ServicioTipo.All.Contains(servicio))
            return BadRequest(new { message = $"Servicio inválido. Usa uno de: {string.Join(", ", ServicioTipo.All)}." });
        if (!OportunidadEtapa.All.Contains(etapa))
            return BadRequest(new { message = $"Etapa inválida. Usa una de: {string.Join(", ", OportunidadEtapa.All)}." });
        if (!await db.Empresas.AnyAsync(e => e.Id == empresaId, ct))
            return BadRequest(new { message = "La empresa no existe." });
        if (contactoId.HasValue && !await db.Contactos.AnyAsync(c => c.Id == contactoId && c.EmpresaId == empresaId, ct))
            return BadRequest(new { message = "El contacto no pertenece a esta empresa." });
        if (responsableId.HasValue && !await db.AdminUsers.AnyAsync(u => u.Id == responsableId, ct))
            return BadRequest(new { message = "El responsable no existe." });
        return null;
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
