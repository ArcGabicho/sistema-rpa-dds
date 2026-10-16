using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/diagnosticos")]
[Authorize]
public class DiagnosticosController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResponse<DiagnosticoListItem>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? estado,
        [FromQuery] int? empresaId,
        [FromQuery] int? oportunidadId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Diagnosticos.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(d => d.Titulo.Contains(term) || (d.Empresa != null && d.Empresa.NombreComercial.Contains(term)));
        }
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(d => d.Estado == estado);
        if (empresaId.HasValue) query = query.Where(d => d.EmpresaId == empresaId);
        if (oportunidadId.HasValue) query = query.Where(d => d.OportunidadId == oportunidadId);

        var totalCount = await query.CountAsync(ct);
        var diagnosticos = await query
            .Include(d => d.Empresa)
            .Include(d => d.Oportunidad)
            .Include(d => d.Responsable)
            .Include(d => d.Procesos)
            .OrderByDescending(d => d.UpdatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(ct);

        var items = diagnosticos.Select(d => new DiagnosticoListItem
        {
            Id = d.Id,
            Titulo = d.Titulo,
            EmpresaId = d.EmpresaId,
            EmpresaNombre = d.Empresa?.NombreComercial ?? "—",
            OportunidadId = d.OportunidadId,
            OportunidadTitulo = d.Oportunidad?.Titulo,
            Estado = d.Estado,
            ResponsableNombre = d.Responsable?.FullName,
            Totales = DiagnosticoMapping.Totales(d.Procesos, d.CostoHora),
            UpdatedAtUtc = d.UpdatedAtUtc,
        }).ToList();

        return Ok(PagedResponse<DiagnosticoListItem>.Create(items, page, pageSize, totalCount));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DiagnosticoResponse>> GetById(int id, CancellationToken ct)
    {
        var d = await db.Diagnosticos
            .AsNoTracking()
            .Include(x => x.Empresa)
            .Include(x => x.Oportunidad)
            .Include(x => x.Responsable)
            .Include(x => x.Procesos)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (d is null) return NotFound();

        return Ok(new DiagnosticoResponse
        {
            Id = d.Id,
            Titulo = d.Titulo,
            EmpresaId = d.EmpresaId,
            EmpresaNombre = d.Empresa?.NombreComercial ?? "—",
            OportunidadId = d.OportunidadId,
            OportunidadTitulo = d.Oportunidad?.Titulo,
            OportunidadEtapa = d.Oportunidad?.Etapa,
            Estado = d.Estado,
            CostoHora = d.CostoHora,
            Resumen = d.Resumen,
            ResponsableId = d.ResponsableId,
            ResponsableNombre = d.Responsable?.FullName,
            EntregadoAtUtc = d.EntregadoAtUtc,
            CreatedAtUtc = d.CreatedAtUtc,
            UpdatedAtUtc = d.UpdatedAtUtc,
            Procesos = d.Procesos.OrderBy(p => p.Orden).ThenBy(p => p.Id).Select(p => DiagnosticoMapping.ToProceso(p, d.CostoHora)).ToList(),
            Totales = DiagnosticoMapping.Totales(d.Procesos, d.CostoHora),
        });
    }

    // Starting a diagnosis from an opportunity moves it to the "diagnóstico"
    // stage if it hadn't got there yet, and notes it on its timeline.
    [HttpPost]
    public async Task<IActionResult> Create(CreateDiagnosticoRequest request, CancellationToken ct)
    {
        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();

        Oportunidad? oportunidad = null;
        if (request.OportunidadId.HasValue)
        {
            oportunidad = await db.Oportunidades.FindAsync([request.OportunidadId.Value], ct);
            if (oportunidad is null) return BadRequest(new { message = "La oportunidad no existe." });
            if (request.EmpresaId.HasValue && request.EmpresaId != oportunidad.EmpresaId)
                return BadRequest(new { message = "La oportunidad no es de esa empresa." });
        }
        var empresaId = oportunidad?.EmpresaId ?? request.EmpresaId;
        if (empresaId is null || !await db.Empresas.AnyAsync(e => e.Id == empresaId, ct))
            return BadRequest(new { message = "Elige la empresa del diagnóstico." });
        if (request.ResponsableId.HasValue && !await db.AdminUsers.AnyAsync(u => u.Id == request.ResponsableId, ct))
            return BadRequest(new { message = "El responsable no existe." });

        var diagnostico = new Diagnostico
        {
            EmpresaId = empresaId.Value,
            OportunidadId = oportunidad?.Id,
            Titulo = request.Titulo.Trim(),
            Estado = DiagnosticoEstado.EnCurso,
            CostoHora = request.CostoHora,
            Resumen = Normalize(request.Resumen),
            ResponsableId = request.ResponsableId ?? autorId,
        };
        db.Diagnosticos.Add(diagnostico);

        if (oportunidad is not null)
        {
            Embudo.Anotar(db, oportunidad, $"Se inició el diagnóstico «{diagnostico.Titulo}».", autorId);
            var antes = Array.IndexOf(OportunidadEtapa.Abiertas, oportunidad.Etapa) < Array.IndexOf(OportunidadEtapa.Abiertas, OportunidadEtapa.Diagnostico);
            if (OportunidadEtapa.Abiertas.Contains(oportunidad.Etapa) && antes)
                await Embudo.CambiarEtapaAsync(db, oportunidad, OportunidadEtapa.Diagnostico, null, autorId, ct);
        }

        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = diagnostico.Id }, new { id = diagnostico.Id });
    }

    // Marking it delivered stamps the date and notes the result on the
    // opportunity: what DDS put in front of the client.
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateDiagnosticoRequest request, CancellationToken ct)
    {
        if (!DiagnosticoEstado.All.Contains(request.Estado))
            return BadRequest(new { message = $"Estado inválido. Usa uno de: {string.Join(", ", DiagnosticoEstado.All)}." });

        var diagnostico = await db.Diagnosticos.Include(d => d.Procesos).FirstOrDefaultAsync(d => d.Id == id, ct);
        if (diagnostico is null) return NotFound();
        if (request.ResponsableId.HasValue && !await db.AdminUsers.AnyAsync(u => u.Id == request.ResponsableId, ct))
            return BadRequest(new { message = "El responsable no existe." });

        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        var entregaAhora = request.Estado == DiagnosticoEstado.Entregado && diagnostico.Estado != DiagnosticoEstado.Entregado;

        diagnostico.Titulo = request.Titulo.Trim();
        diagnostico.CostoHora = request.CostoHora;
        diagnostico.Resumen = Normalize(request.Resumen);
        diagnostico.ResponsableId = request.ResponsableId;
        diagnostico.Estado = request.Estado;
        if (entregaAhora) diagnostico.EntregadoAtUtc = DateTime.UtcNow;
        else if (request.Estado == DiagnosticoEstado.EnCurso) diagnostico.EntregadoAtUtc = null;
        diagnostico.UpdatedAtUtc = DateTime.UtcNow;

        if (entregaAhora && diagnostico.OportunidadId is { } oportunidadId
            && await db.Oportunidades.FindAsync([oportunidadId], ct) is { } oportunidad)
        {
            var t = DiagnosticoMapping.Totales(diagnostico.Procesos, diagnostico.CostoHora);
            var soles = t.AhorroAnual.ToString("N0", CultureInfo.InvariantCulture);
            Embudo.Anotar(db, oportunidad,
                $"Diagnóstico entregado: «{diagnostico.Titulo}». {t.Procesos} {(t.Procesos == 1 ? "proceso" : "procesos")}, " +
                $"{t.QuickWins} quick {(t.QuickWins == 1 ? "win" : "wins")}, ahorro anual estimado S/ {soles}.", autorId);
        }

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var diagnostico = await db.Diagnosticos.FindAsync([id], ct);
        if (diagnostico is null) return NotFound();

        // Proposals built from it stay, unlinked (their FK is NoAction).
        await db.Propuestas
            .Where(p => p.DiagnosticoId == id)
            .ExecuteUpdateAsync(set => set.SetProperty(p => p.DiagnosticoId, (int?)null), ct);
        db.Diagnosticos.Remove(diagnostico);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:int}/procesos")]
    public async Task<ActionResult<ProcesoResponse>> AddProceso(int id, ProcesoRequest request, CancellationToken ct)
    {
        if (!ServicioTipo.All.Contains(request.Servicio))
            return BadRequest(new { message = $"Servicio inválido. Usa uno de: {string.Join(", ", ServicioTipo.All)}." });

        var diagnostico = await db.Diagnosticos.FindAsync([id], ct);
        if (diagnostico is null) return NotFound();

        var orden = await db.ProcesosEvaluados.Where(p => p.DiagnosticoId == id).MaxAsync(p => (int?)p.Orden, ct) ?? 0;
        var proceso = new ProcesoEvaluado { DiagnosticoId = id, Nombre = "", Servicio = request.Servicio, Orden = orden + 1 };
        ProcesosController.Apply(proceso, request);
        db.ProcesosEvaluados.Add(proceso);
        diagnostico.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(DiagnosticoMapping.ToProceso(proceso, diagnostico.CostoHora));
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
