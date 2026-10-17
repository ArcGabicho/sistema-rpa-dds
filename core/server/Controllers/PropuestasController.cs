using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

// Proposals: drafts are edited as a whole document; sending freezes them.
// Sending, accepting and rejecting are logged on the opportunity, and move
// it through the pipeline (sent → "propuesta", accepted → "ganada").
[ApiController]
[Route("api/propuestas")]
[Authorize]
public class PropuestasController(AppDbContext db) : ControllerBase
{
    // estado: one status, or "vencida" (sent, and past its validity date).
    [HttpGet]
    public async Task<ActionResult<PagedResponse<PropuestaListItem>>> GetAll(
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
        var hoy = Lima.Hoy;

        var query = db.Propuestas.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(p => p.Titulo.Contains(term) || p.Codigo.Contains(term) || (p.Empresa != null && p.Empresa.NombreComercial.Contains(term)));
        }
        if (estado == "vencida") query = query.Where(p => p.Estado == PropuestaEstado.Enviada && p.ValidaHasta < hoy);
        else if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(p => p.Estado == estado);
        if (empresaId.HasValue) query = query.Where(p => p.EmpresaId == empresaId);
        if (oportunidadId.HasValue) query = query.Where(p => p.OportunidadId == oportunidadId);

        var totalCount = await query.CountAsync(ct);
        var propuestas = await query
            .Include(p => p.Empresa)
            .Include(p => p.Oportunidad)
            .Include(p => p.Items)
            .Include(p => p.Fases)
            .OrderByDescending(p => p.UpdatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(ct);

        var items = propuestas.Select(p => new PropuestaListItem
        {
            Id = p.Id,
            Codigo = p.Codigo,
            Version = p.Version,
            Titulo = p.Titulo,
            EmpresaId = p.EmpresaId,
            EmpresaNombre = p.Empresa?.NombreComercial ?? "—",
            OportunidadId = p.OportunidadId,
            OportunidadTitulo = p.Oportunidad?.Titulo,
            Estado = p.Estado,
            Moneda = p.Moneda,
            Totales = ToTotales(PropuestaCalculo.Calcular(p)),
            EnviadaAtUtc = p.EnviadaAtUtc,
            ValidaHasta = p.ValidaHasta,
            UpdatedAtUtc = p.UpdatedAtUtc,
        }).ToList();

        return Ok(PagedResponse<PropuestaListItem>.Create(items, page, pageSize, totalCount));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PropuestaResponse>> GetById(int id, CancellationToken ct)
    {
        var p = await db.Propuestas
            .AsNoTracking()
            .Include(x => x.Empresa)
            .Include(x => x.Oportunidad).ThenInclude(o => o!.Contacto)
            .Include(x => x.Diagnostico)
            .Include(x => x.Responsable)
            .Include(x => x.Items)
            .Include(x => x.Fases)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return NotFound();

        var versiones = await db.Propuestas
            .AsNoTracking()
            .Where(x => x.Codigo == p.Codigo)
            .OrderBy(x => x.Version)
            .Select(x => new PropuestaVersionItem { Id = x.Id, Version = x.Version, Estado = x.Estado, UpdatedAtUtc = x.UpdatedAtUtc })
            .ToListAsync(ct);
        var contacto = p.Oportunidad?.Contacto;

        return Ok(new PropuestaResponse
        {
            Id = p.Id,
            Codigo = p.Codigo,
            Version = p.Version,
            Titulo = p.Titulo,
            EmpresaId = p.EmpresaId,
            EmpresaNombre = p.Empresa?.NombreComercial ?? "—",
            EmpresaRazonSocial = p.Empresa?.RazonSocial,
            EmpresaRuc = p.Empresa?.Ruc,
            OportunidadId = p.OportunidadId,
            OportunidadTitulo = p.Oportunidad?.Titulo,
            OportunidadEtapa = p.Oportunidad?.Etapa,
            ContactoNombre = contacto is null ? null : $"{contacto.Nombres} {contacto.Apellidos}".Trim(),
            ContactoCargo = contacto?.Cargo,
            DiagnosticoId = p.DiagnosticoId,
            DiagnosticoTitulo = p.Diagnostico?.Titulo,
            Estado = p.Estado,
            Moneda = p.Moneda,
            DescuentoPorcentaje = p.DescuentoPorcentaje,
            AhorroAnualEstimado = p.AhorroAnualEstimado,
            Introduccion = p.Introduccion,
            Supuestos = p.Supuestos,
            Exclusiones = p.Exclusiones,
            CondicionesPago = p.CondicionesPago,
            ValidaHasta = p.ValidaHasta,
            ResponsableId = p.ResponsableId,
            ResponsableNombre = p.Responsable?.FullName,
            EnviadaAtUtc = p.EnviadaAtUtc,
            RespondidaAtUtc = p.RespondidaAtUtc,
            MotivoRechazo = p.MotivoRechazo,
            CreatedAtUtc = p.CreatedAtUtc,
            UpdatedAtUtc = p.UpdatedAtUtc,
            Items = p.Items.OrderBy(i => i.Orden).Select(i => new PropuestaItemDto
            {
                Tipo = i.Tipo,
                Descripcion = i.Descripcion,
                Detalle = i.Detalle,
                Cantidad = i.Cantidad,
                PrecioUnitario = i.PrecioUnitario,
                ProcesoOrigenId = i.ProcesoOrigenId,
            }).ToList(),
            Fases = p.Fases.OrderBy(f => f.Orden).Select(f => new PropuestaFaseDto
            {
                Nombre = f.Nombre,
                Descripcion = f.Descripcion,
                Semanas = f.Semanas,
            }).ToList(),
            Totales = ToTotales(PropuestaCalculo.Calcular(p)),
            Versiones = versiones,
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePropuestaRequest request, CancellationToken ct)
    {
        if (!Moneda.All.Contains(request.Moneda))
            return BadRequest(new { message = $"Moneda inválida. Usa una de: {string.Join(", ", Moneda.All)}." });
        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();

        Diagnostico? diagnostico = null;
        if (request.DiagnosticoId.HasValue)
        {
            diagnostico = await db.Diagnosticos.Include(d => d.Procesos).FirstOrDefaultAsync(d => d.Id == request.DiagnosticoId, ct);
            if (diagnostico is null) return BadRequest(new { message = "El diagnóstico no existe." });
        }

        var oportunidadId = request.OportunidadId ?? diagnostico?.OportunidadId;
        Oportunidad? oportunidad = null;
        if (oportunidadId.HasValue)
        {
            oportunidad = await db.Oportunidades.FindAsync([oportunidadId.Value], ct);
            if (oportunidad is null) return BadRequest(new { message = "La oportunidad no existe." });
        }

        var empresaId = oportunidad?.EmpresaId ?? diagnostico?.EmpresaId ?? request.EmpresaId;
        if (empresaId is null || !await db.Empresas.AnyAsync(e => e.Id == empresaId, ct))
            return BadRequest(new { message = "Elige la empresa de la propuesta." });
        if ((request.EmpresaId.HasValue && request.EmpresaId != empresaId) || (diagnostico is not null && diagnostico.EmpresaId != empresaId))
            return BadRequest(new { message = "La oportunidad, el diagnóstico y la empresa no coinciden." });

        var propuesta = new Propuesta
        {
            Codigo = await PropuestaBorrador.SiguienteCodigoAsync(db, ct),
            EmpresaId = empresaId.Value,
            OportunidadId = oportunidad?.Id,
            Titulo = string.IsNullOrWhiteSpace(request.Titulo) ? "Propuesta de automatización" : request.Titulo.Trim(),
            Estado = PropuestaEstado.Borrador,
            Moneda = request.Moneda,
            ResponsableId = autorId,
        };

        if (diagnostico is not null)
        {
            // The chosen processes, or by default everything worth doing now.
            var procesos = diagnostico.Procesos
                .Where(p => request.ProcesoIds is { Count: > 0 } ids
                    ? ids.Contains(p.Id)
                    : Roi.Calcular(p, diagnostico.CostoHora).Cuadrante is Roi.Cuadrante.QuickWin or Roi.Cuadrante.MejoraMenor or Roi.Cuadrante.Estrategico)
                .OrderBy(p => p.Orden)
                .ToList();
            PropuestaBorrador.DesdeDiagnostico(propuesta, diagnostico, procesos);
        }
        else
        {
            PropuestaBorrador.FasesBase(propuesta, 1);
        }
        PropuestaBorrador.TextosBase(propuesta);

        db.Propuestas.Add(propuesta);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = propuesta.Id }, new { id = propuesta.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdatePropuestaRequest request, CancellationToken ct)
    {
        if (!Moneda.All.Contains(request.Moneda))
            return BadRequest(new { message = $"Moneda inválida. Usa una de: {string.Join(", ", Moneda.All)}." });
        if (request.Items.Any(i => !PropuestaItemTipo.All.Contains(i.Tipo)))
            return BadRequest(new { message = "Tipo de ítem inválido." });

        var propuesta = await db.Propuestas.Include(p => p.Items).Include(p => p.Fases).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (propuesta is null) return NotFound();
        if (propuesta.Estado != PropuestaEstado.Borrador) return Congelada();
        if (request.ResponsableId.HasValue && !await db.AdminUsers.AnyAsync(u => u.Id == request.ResponsableId, ct))
            return BadRequest(new { message = "El responsable no existe." });

        propuesta.Titulo = request.Titulo.Trim();
        propuesta.Moneda = request.Moneda;
        propuesta.DescuentoPorcentaje = request.DescuentoPorcentaje;
        propuesta.AhorroAnualEstimado = request.AhorroAnualEstimado;
        propuesta.Introduccion = Normalize(request.Introduccion);
        propuesta.Supuestos = Normalize(request.Supuestos);
        propuesta.Exclusiones = Normalize(request.Exclusiones);
        propuesta.CondicionesPago = Normalize(request.CondicionesPago);
        propuesta.ValidaHasta = request.ValidaHasta?.Date;
        propuesta.ResponsableId = request.ResponsableId;

        db.PropuestaItems.RemoveRange(propuesta.Items);
        db.PropuestaFases.RemoveRange(propuesta.Fases);
        propuesta.Items = request.Items.Select((i, n) => new PropuestaItem
        {
            Tipo = i.Tipo,
            Descripcion = i.Descripcion.Trim(),
            Detalle = Normalize(i.Detalle),
            Cantidad = i.Cantidad,
            PrecioUnitario = i.PrecioUnitario,
            Orden = n + 1,
            ProcesoOrigenId = i.ProcesoOrigenId,
        }).ToList();
        propuesta.Fases = request.Fases.Select((f, n) => new PropuestaFase
        {
            Nombre = f.Nombre.Trim(),
            Descripcion = Normalize(f.Descripcion),
            Semanas = f.Semanas,
            Orden = n + 1,
        }).ToList();
        propuesta.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // Freezes the draft, sets its validity if missing, and updates the
    // opportunity: its value becomes what was quoted, and it moves to the
    // "propuesta" stage if it was earlier in the pipeline.
    [HttpPost("{id:int}/enviar")]
    public async Task<IActionResult> Enviar(int id, CancellationToken ct)
    {
        var propuesta = await db.Propuestas.Include(p => p.Items).Include(p => p.Fases).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (propuesta is null) return NotFound();
        if (propuesta.Estado != PropuestaEstado.Borrador)
            return Conflict(new { message = "Solo se envía un borrador." });
        if (propuesta.Items.Count == 0)
            return BadRequest(new { message = "Agrega al menos un ítem antes de enviarla." });

        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        propuesta.Estado = PropuestaEstado.Enviada;
        propuesta.EnviadaAtUtc = propuesta.UpdatedAtUtc = DateTime.UtcNow;
        propuesta.ValidaHasta ??= Lima.Hoy.AddDays(PropuestaBorrador.DiasValidez);

        if (await OportunidadDeAsync(propuesta, ct) is { } oportunidad)
        {
            var t = PropuestaCalculo.Calcular(propuesta);
            oportunidad.ValorEstimado = propuesta.Moneda == Moneda.Soles ? t.ValorPrimerAnio : oportunidad.ValorEstimado;
            var mensual = t.BaseMensual > 0 ? $" + {Monto(propuesta.Moneda, t.BaseMensual)} al mes" : "";
            Embudo.Anotar(db, oportunidad,
                $"Propuesta {Nombre(propuesta)} enviada: {Monto(propuesta.Moneda, t.BaseImplementacion)}{mensual} (más IGV).", autorId);
            var etapaActual = Array.IndexOf(OportunidadEtapa.Abiertas, oportunidad.Etapa);
            if (etapaActual >= 0 && etapaActual < Array.IndexOf(OportunidadEtapa.Abiertas, OportunidadEtapa.Propuesta))
                await Embudo.CambiarEtapaAsync(db, oportunidad, OportunidadEtapa.Propuesta, null, autorId, ct);
        }

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:int}/aceptar")]
    public async Task<IActionResult> Aceptar(int id, CancellationToken ct)
    {
        var propuesta = await db.Propuestas.FindAsync([id], ct);
        if (propuesta is null) return NotFound();
        if (propuesta.Estado != PropuestaEstado.Enviada)
            return Conflict(new { message = "Solo se acepta una propuesta enviada." });

        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        propuesta.Estado = PropuestaEstado.Aceptada;
        propuesta.RespondidaAtUtc = propuesta.UpdatedAtUtc = DateTime.UtcNow;

        if (await OportunidadDeAsync(propuesta, ct) is { } oportunidad)
        {
            Embudo.Anotar(db, oportunidad, $"Propuesta {Nombre(propuesta)} aceptada por el cliente.", autorId);
            await Embudo.CambiarEtapaAsync(db, oportunidad, OportunidadEtapa.Ganada, null, autorId, ct);
        }

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // The opportunity stays where it is: the team decides whether to send a
    // new version or close it as lost.
    [HttpPost("{id:int}/rechazar")]
    public async Task<IActionResult> Rechazar(int id, RechazarPropuestaRequest request, CancellationToken ct)
    {
        var propuesta = await db.Propuestas.FindAsync([id], ct);
        if (propuesta is null) return NotFound();
        if (propuesta.Estado != PropuestaEstado.Enviada)
            return Conflict(new { message = "Solo se rechaza una propuesta enviada." });

        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        propuesta.Estado = PropuestaEstado.Rechazada;
        propuesta.MotivoRechazo = request.Motivo.Trim();
        propuesta.RespondidaAtUtc = propuesta.UpdatedAtUtc = DateTime.UtcNow;

        if (await OportunidadDeAsync(propuesta, ct) is { } oportunidad)
            Embudo.Anotar(db, oportunidad, $"Propuesta {Nombre(propuesta)} rechazada. Motivo: {propuesta.MotivoRechazo}", autorId);

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // A new draft from the latest version (sent or rejected), to adjust it
    // after a negotiation. A sent one is marked as replaced.
    [HttpPost("{id:int}/nueva-version")]
    public async Task<IActionResult> NuevaVersion(int id, CancellationToken ct)
    {
        var origen = await db.Propuestas.AsNoTracking().Include(p => p.Items).Include(p => p.Fases).AsSplitQuery().FirstOrDefaultAsync(p => p.Id == id, ct);
        if (origen is null) return NotFound();

        var ultima = await db.Propuestas.Where(p => p.Codigo == origen.Codigo).MaxAsync(p => p.Version, ct);
        if (origen.Version != ultima)
            return Conflict(new { message = "Ya hay una versión más reciente de esta propuesta." });
        if (origen.Estado is not (PropuestaEstado.Enviada or PropuestaEstado.Rechazada))
            return Conflict(new { message = "Solo se versiona una propuesta enviada o rechazada; un borrador se edita directamente." });

        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        var copia = new Propuesta
        {
            Codigo = origen.Codigo,
            Version = origen.Version + 1,
            EmpresaId = origen.EmpresaId,
            OportunidadId = origen.OportunidadId,
            DiagnosticoId = origen.DiagnosticoId,
            Titulo = origen.Titulo,
            Estado = PropuestaEstado.Borrador,
            Moneda = origen.Moneda,
            DescuentoPorcentaje = origen.DescuentoPorcentaje,
            AhorroAnualEstimado = origen.AhorroAnualEstimado,
            Introduccion = origen.Introduccion,
            Supuestos = origen.Supuestos,
            Exclusiones = origen.Exclusiones,
            CondicionesPago = origen.CondicionesPago,
            ResponsableId = autorId ?? origen.ResponsableId,
            Items = origen.Items.OrderBy(i => i.Orden).Select(i => new PropuestaItem
            {
                Tipo = i.Tipo, Descripcion = i.Descripcion, Detalle = i.Detalle, Cantidad = i.Cantidad, PrecioUnitario = i.PrecioUnitario, Orden = i.Orden,
                ProcesoOrigenId = i.ProcesoOrigenId,
            }).ToList(),
            Fases = origen.Fases.OrderBy(f => f.Orden).Select(f => new PropuestaFase
            {
                Nombre = f.Nombre, Descripcion = f.Descripcion, Semanas = f.Semanas, Orden = f.Orden,
            }).ToList(),
        };
        db.Propuestas.Add(copia);

        if (origen.Estado == PropuestaEstado.Enviada)
        {
            var anterior = await db.Propuestas.FindAsync([origen.Id], ct);
            anterior!.Estado = PropuestaEstado.Reemplazada;
            anterior.UpdatedAtUtc = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = copia.Id }, new { id = copia.Id });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var propuesta = await db.Propuestas.FindAsync([id], ct);
        if (propuesta is null) return NotFound();

        // A project built from it stays, unlinked (its FK is NoAction).
        await db.Proyectos
            .Where(p => p.PropuestaId == id)
            .ExecuteUpdateAsync(set => set.SetProperty(p => p.PropuestaId, (int?)null), ct);
        db.Propuestas.Remove(propuesta);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<Oportunidad?> OportunidadDeAsync(Propuesta propuesta, CancellationToken ct) =>
        propuesta.OportunidadId is { } oportunidadId ? await db.Oportunidades.FindAsync([oportunidadId], ct) : null;

    private static string Nombre(Propuesta p) => $"{p.Codigo} v{p.Version}";

    private static string Monto(string moneda, decimal valor) =>
        $"{(moneda == Moneda.Dolares ? "US$" : "S/")} {valor.ToString("N0", CultureInfo.InvariantCulture)}";

    private static TotalesPropuestaResponse ToTotales(PropuestaCalculo.Totales t) => new()
    {
        SubtotalImplementacion = t.SubtotalImplementacion,
        Descuento = t.Descuento,
        BaseImplementacion = t.BaseImplementacion,
        IgvImplementacion = t.IgvImplementacion,
        TotalImplementacion = t.TotalImplementacion,
        BaseMensual = t.BaseMensual,
        IgvMensual = t.IgvMensual,
        TotalMensual = t.TotalMensual,
        ValorPrimerAnio = t.ValorPrimerAnio,
        Semanas = t.Semanas,
        PaybackMeses = t.PaybackMeses,
        Roi12Meses = t.Roi12Meses,
    };

    private ConflictObjectResult Congelada() =>
        Conflict(new { message = "Esta propuesta ya se envió y no se puede cambiar: crea una nueva versión." });

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
