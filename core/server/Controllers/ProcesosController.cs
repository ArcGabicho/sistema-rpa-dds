using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

// A diagnosis's processes are added under it (POST /api/diagnosticos/{id}/procesos);
// this controller edits and removes them.
[ApiController]
[Route("api/procesos")]
[Authorize]
[Modulo(Modulo.Diagnosticos)]
public class ProcesosController(AppDbContext db) : ControllerBase
{
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProcesoResponse>> Update(int id, ProcesoRequest request, CancellationToken ct)
    {
        if (!ServicioTipo.All.Contains(request.Servicio))
            return BadRequest(new { message = $"Servicio inválido. Usa uno de: {string.Join(", ", ServicioTipo.All)}." });

        var proceso = await db.ProcesosEvaluados.Include(p => p.Diagnostico).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (proceso?.Diagnostico is null) return NotFound();

        Apply(proceso, request);
        proceso.Diagnostico.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(DiagnosticoMapping.ToProceso(proceso, proceso.Diagnostico.CostoHora));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var proceso = await db.ProcesosEvaluados.Include(p => p.Diagnostico).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (proceso is null) return NotFound();

        if (proceso.Diagnostico is not null) proceso.Diagnostico.UpdatedAtUtc = DateTime.UtcNow;
        db.ProcesosEvaluados.Remove(proceso);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    internal static void Apply(ProcesoEvaluado p, ProcesoRequest r)
    {
        p.Nombre = r.Nombre.Trim();
        p.Area = string.IsNullOrWhiteSpace(r.Area) ? null : r.Area.Trim();
        p.Descripcion = string.IsNullOrWhiteSpace(r.Descripcion) ? null : r.Descripcion.Trim();
        p.Servicio = r.Servicio;
        p.EjecucionesMes = r.EjecucionesMes;
        p.MinutosPorEjecucion = r.MinutosPorEjecucion;
        p.Personas = r.Personas;
        p.TasaError = r.TasaError;
        p.CostoHora = r.CostoHora;
        p.ReglasClaras = r.ReglasClaras;
        p.DatosDigitales = r.DatosDigitales;
        p.SistemasEstables = r.SistemasEstables;
        p.ProcesoEstandar = r.ProcesoEstandar;
        p.PocasExcepciones = r.PocasExcepciones;
        p.PorcentajeAutomatizable = r.PorcentajeAutomatizable;
        p.CostoImplementacion = r.CostoImplementacion;
        p.CostoMensual = r.CostoMensual;
    }
}
