using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

// Support tickets with their SLA (Services/Sla.cs). Every change of state,
// severity or owner goes on the incident's history; it counts as answered
// once someone takes it (it leaves "abierta").
[ApiController]
[Route("api/incidencias")]
[Authorize]
public class IncidenciasController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResponse<IncidenciaListItem>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? estado,
        [FromQuery] string? severidad,
        [FromQuery] int? empresaId,
        [FromQuery] int? botId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var ahora = DateTime.UtcNow;

        var query = db.Incidencias.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(i => i.Codigo.Contains(term) || i.Titulo.Contains(term)
                || (i.Bot != null && i.Bot.Nombre.Contains(term)) || (i.Empresa != null && i.Empresa.NombreComercial.Contains(term)));
        }
        var abiertas = estado == "abiertas";
        if (abiertas) query = query.Where(i => IncidenciaEstado.Abiertas.Contains(i.Estado));
        else if (estado == "resueltas") query = query.Where(i => i.Estado == IncidenciaEstado.Resuelta);
        else if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(i => i.Estado == estado);
        if (!string.IsNullOrWhiteSpace(severidad)) query = query.Where(i => i.Severidad == severidad);
        if (empresaId.HasValue) query = query.Where(i => i.EmpresaId == empresaId);
        if (botId.HasValue) query = query.Where(i => i.BotId == botId);

        var totalCount = await query.CountAsync(ct);
        query = query.Include(i => i.Empresa).Include(i => i.Bot).Include(i => i.Responsable);

        List<IncidenciaListItem> items;
        if (abiertas)
        {
            // Open ones by what's due first; the deadline depends on pauses,
            // so it's worked out here (there are never many open at once).
            items = (await query.Take(1000).ToListAsync(ct))
                .Select(i => OperacionMapping.LlenarIncidencia(new IncidenciaListItem(), i, ahora))
                .OrderBy(i => i.Sla!.Semaforo == Sla.Semaforo.Pausado)
                .ThenBy(i => i.Sla!.VenceResolucionUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();
        }
        else
        {
            items = (await query.OrderByDescending(i => i.CreatedAtUtc).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct))
                .Select(i => OperacionMapping.LlenarIncidencia(new IncidenciaListItem(), i, ahora))
                .ToList();
        }
        return Ok(PagedResponse<IncidenciaListItem>.Create(items, page, pageSize, totalCount));
    }

    [HttpGet("resumen")]
    public async Task<ActionResult<IncidenciasResumenResponse>> GetResumen(CancellationToken ct)
    {
        var ahora = DateTime.UtcNow;
        var desde = ahora.AddDays(-90);
        var abiertas = await db.Incidencias.AsNoTracking().Where(i => IncidenciaEstado.Abiertas.Contains(i.Estado)).ToListAsync(ct);
        var resueltas = await db.Incidencias.AsNoTracking().Where(i => i.ResueltaAtUtc != null && i.ResueltaAtUtc >= desde).ToListAsync(ct);

        // Hours to resolve, without the time spent waiting on the client.
        var horas = resueltas
            .Select(i => ((i.ResueltaAtUtc!.Value - i.CreatedAtUtc).TotalMinutes - i.MinutosEnPausa) / 60)
            .Order()
            .ToList();
        decimal? mediana = horas.Count == 0 ? null
            : Math.Round((decimal)(horas.Count % 2 == 1 ? horas[horas.Count / 2] : (horas[horas.Count / 2 - 1] + horas[horas.Count / 2]) / 2), 1);

        return Ok(new IncidenciasResumenResponse
        {
            Abiertas = abiertas.Count,
            Graves = abiertas.Count(i => i.Severidad is Severidad.Critica or Severidad.Alta),
            FueraDeSla = abiertas.Count(i => Sla.Evaluar(i, ahora).Semaforo == Sla.Semaforo.Vencido),
            Resueltas90 = resueltas.Count,
            CumplimientoSla90 = resueltas.Count == 0 ? null
                : Math.Round((decimal)resueltas.Count(i => Sla.Evaluar(i, ahora).ResolucionCumplida == true) / resueltas.Count, 3),
            HorasMedianaResolucion90 = mediana,
            PorCausa90 = resueltas
                .Where(i => i.Causa != null)
                .GroupBy(i => i.Causa!)
                .Select(g => new CausaCantidad { Causa = g.Key, Cantidad = g.Count() })
                .OrderByDescending(c => c.Cantidad)
                .ToList(),
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<IncidenciaResponse>> GetById(int id, CancellationToken ct)
    {
        var i = await db.Incidencias.AsNoTracking()
            .Include(x => x.Empresa)
            .Include(x => x.Bot)
            .Include(x => x.Responsable)
            .Include(x => x.Seguimiento).ThenInclude(s => s.Autor)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (i is null) return NotFound();

        var r = OperacionMapping.LlenarIncidencia(new IncidenciaResponse(), i, DateTime.UtcNow);
        r.Descripcion = i.Descripcion;
        r.Canal = i.Canal;
        r.ReportadoPor = i.ReportadoPor;
        r.ResponsableId = i.ResponsableId;
        r.PrimeraRespuestaAtUtc = i.PrimeraRespuestaAtUtc;
        r.MinutosEnPausa = i.MinutosEnPausa + (i.PausadaDesdeUtc is { } desde ? (int)Math.Round((DateTime.UtcNow - desde).TotalMinutes) : 0);
        r.PausadaDesdeUtc = i.PausadaDesdeUtc;
        r.Solucion = i.Solucion;
        r.Seguimiento = i.Seguimiento.OrderBy(s => s.CreatedAtUtc).ThenBy(s => s.Id).Select(s => new SeguimientoResponse
        {
            Id = s.Id,
            Tipo = s.Tipo,
            Texto = s.Texto,
            AutorNombre = s.Autor?.FullName ?? (s.AutorId is null && s.Tipo == SeguimientoTipo.Nota ? "Usuario eliminado" : null),
            CreatedAtUtc = s.CreatedAtUtc,
        }).ToList();
        return Ok(r);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateIncidenciaRequest request, CancellationToken ct)
    {
        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();
        if (!Severidad.All.Contains(request.Severidad)) return BadRequest(new { message = "Severidad inválida." });
        if (!IncidenciaCanal.All.Contains(request.Canal)) return BadRequest(new { message = "Canal inválido." });
        if (request.ResponsableId.HasValue && !await db.AdminUsers.AnyAsync(u => u.Id == request.ResponsableId, ct))
            return BadRequest(new { message = "El responsable no existe." });

        int empresaId;
        if (request.BotId is { } botId)
        {
            var bot = await db.Bots.FindAsync([botId], ct);
            if (bot is null) return BadRequest(new { message = "El bot no existe." });
            empresaId = bot.EmpresaId;
        }
        else if (request.EmpresaId is { } eid && await db.Empresas.AnyAsync(e => e.Id == eid, ct)) empresaId = eid;
        else return BadRequest(new { message = "Elige el bot o la empresa de la incidencia." });

        var incidencia = new Incidencia
        {
            Codigo = await SiguienteCodigoAsync(db, ct),
            Titulo = request.Titulo.Trim(),
            Descripcion = Normalize(request.Descripcion),
            EmpresaId = empresaId,
            BotId = request.BotId,
            Severidad = request.Severidad,
            Estado = IncidenciaEstado.Abierta,
            Canal = request.Canal,
            ReportadoPor = Normalize(request.ReportadoPor),
            ResponsableId = request.ResponsableId ?? autorId,
        };
        incidencia.Seguimiento.Add(Cambio($"Incidencia registrada · severidad {Severidad.Label(incidencia.Severidad).ToLowerInvariant()} · {CanalLabel(incidencia.Canal)}.", autorId));
        db.Incidencias.Add(incidencia);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = incidencia.Id }, new { id = incidencia.Id, codigo = incidencia.Codigo });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateIncidenciaRequest request, CancellationToken ct)
    {
        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (!Severidad.All.Contains(request.Severidad)) return BadRequest(new { message = "Severidad inválida." });
        if (!IncidenciaCanal.All.Contains(request.Canal)) return BadRequest(new { message = "Canal inválido." });
        if (request.Causa is not null && !IncidenciaCausa.All.Contains(request.Causa)) return BadRequest(new { message = "Causa inválida." });

        var i = await db.Incidencias.Include(x => x.Responsable).Include(x => x.Bot).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (i is null) return NotFound();

        AdminUser? responsable = null;
        if (request.ResponsableId.HasValue && (responsable = await db.AdminUsers.FindAsync([request.ResponsableId.Value], ct)) is null)
            return BadRequest(new { message = "El responsable no existe." });
        Bot? bot = null;
        if (request.BotId.HasValue)
        {
            bot = await db.Bots.FindAsync([request.BotId.Value], ct);
            if (bot is null || bot.EmpresaId != i.EmpresaId) return BadRequest(new { message = "El bot no es de la empresa de la incidencia." });
        }

        if (i.Severidad != request.Severidad)
            i.Seguimiento.Add(Cambio($"Severidad: {Severidad.Label(i.Severidad)} → {Severidad.Label(request.Severidad)}. El SLA se recalcula desde el reporte.", autorId));
        if (i.ResponsableId != request.ResponsableId)
            i.Seguimiento.Add(Cambio(responsable is null ? "Quedó sin responsable." : $"Responsable: {responsable.FullName}.", autorId));
        if (i.BotId != request.BotId)
            i.Seguimiento.Add(Cambio(bot is null ? "Ya no está ligada a un bot." : $"Bot: {bot.Nombre}.", autorId));

        i.Titulo = request.Titulo.Trim();
        i.Descripcion = Normalize(request.Descripcion);
        i.Severidad = request.Severidad;
        i.Canal = request.Canal;
        i.Causa = request.Causa;
        i.ReportadoPor = Normalize(request.ReportadoPor);
        i.ResponsableId = request.ResponsableId;
        i.BotId = request.BotId;
        i.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // Moves it along: taken (en atención), waiting on the client (the SLA
    // clock stops), resolved (with the cause and the solution), or reopened.
    [HttpPost("{id:int}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, EstadoIncidenciaRequest request, CancellationToken ct)
    {
        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (!IncidenciaEstado.All.Contains(request.Estado) || request.Estado == IncidenciaEstado.Abierta)
            return BadRequest(new { message = "Pasa la incidencia a en atención, esperando al cliente o resuelta." });

        var i = await db.Incidencias.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (i is null) return NotFound();
        if (i.Estado == request.Estado) return NoContent();
        if (i.Estado == IncidenciaEstado.Resuelta && request.Estado != IncidenciaEstado.EnAtencion)
            return BadRequest(new { message = "Una incidencia resuelta solo se reabre en atención." });

        var ahora = DateTime.UtcNow;
        string texto;
        if (request.Estado == IncidenciaEstado.Resuelta)
        {
            if (request.Causa is null || !IncidenciaCausa.All.Contains(request.Causa))
                return BadRequest(new { message = "Indica la causa para resolverla." });
            if (string.IsNullOrWhiteSpace(request.Solucion))
                return BadRequest(new { message = "Describe la solución para resolverla." });
            i.Causa = request.Causa;
            i.Solucion = request.Solucion.Trim();
            i.ResueltaAtUtc = ahora;
            texto = $"Estado: {IncidenciaEstado.Label(i.Estado)} → Resuelta. Causa: {IncidenciaCausa.Label(i.Causa)}.";
        }
        else if (i.Estado == IncidenciaEstado.Resuelta)
        {
            i.ResueltaAtUtc = null;
            texto = "Reabierta: vuelve a en atención.";
        }
        else texto = $"Estado: {IncidenciaEstado.Label(i.Estado)} → {IncidenciaEstado.Label(request.Estado)}.";

        // Taking it is the first response; waiting on the client stops the clock.
        i.PrimeraRespuestaAtUtc ??= ahora;
        if (i.PausadaDesdeUtc is { } pausada)
        {
            i.MinutosEnPausa += (int)Math.Round((ahora - pausada).TotalMinutes);
            i.PausadaDesdeUtc = null;
        }
        if (request.Estado == IncidenciaEstado.EsperandoCliente) i.PausadaDesdeUtc = ahora;

        i.Estado = request.Estado;
        i.UpdatedAtUtc = ahora;
        db.SeguimientosIncidencia.Add(new SeguimientoIncidencia { IncidenciaId = i.Id, Tipo = SeguimientoTipo.Cambio, Texto = texto, AutorId = autorId, CreatedAtUtc = ahora });
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:int}/seguimiento")]
    public async Task<ActionResult<SeguimientoResponse>> AddNota(int id, SeguimientoRequest request, CancellationToken ct)
    {
        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();
        var i = await db.Incidencias.FindAsync([id], ct);
        if (i is null) return NotFound();

        var nota = new SeguimientoIncidencia { IncidenciaId = id, Tipo = SeguimientoTipo.Nota, Texto = request.Texto.Trim(), AutorId = autorId };
        db.SeguimientosIncidencia.Add(nota);
        i.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        var autor = await db.AdminUsers.Where(u => u.Id == autorId).Select(u => u.FullName).FirstOrDefaultAsync(ct);
        return Ok(new SeguimientoResponse { Id = nota.Id, Tipo = nota.Tipo, Texto = nota.Texto, AutorNombre = autor, CreatedAtUtc = nota.CreatedAtUtc });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var i = await db.Incidencias.FindAsync([id], ct);
        if (i is null) return NotFound();
        db.Incidencias.Remove(i);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // "INC-2026-0042": a sequence per year.
    public static async Task<string> SiguienteCodigoAsync(AppDbContext db, CancellationToken ct)
    {
        var prefijo = $"INC-{Lima.Hoy.Year}-";
        var codigos = await db.Incidencias.Where(i => i.Codigo.StartsWith(prefijo)).Select(i => i.Codigo).ToListAsync(ct);
        var ultimo = codigos
            .Select(c => int.TryParse(c[prefijo.Length..], NumberStyles.None, CultureInfo.InvariantCulture, out var n) ? n : 0)
            .DefaultIfEmpty(0)
            .Max();
        return $"{prefijo}{ultimo + 1:0000}";
    }

    private static string CanalLabel(string canal) => canal switch
    {
        IncidenciaCanal.Monitoreo => "alerta del monitoreo",
        IncidenciaCanal.Correo => "por correo",
        IncidenciaCanal.Whatsapp => "por WhatsApp",
        IncidenciaCanal.Llamada => "por llamada",
        _ => "detectada por DDS",
    };

    private static SeguimientoIncidencia Cambio(string texto, int? autorId) => new() { Tipo = SeguimientoTipo.Cambio, Texto = texto, AutorId = autorId };

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
