using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

// What expires and stops a bot or a revenue line if nobody acts: support
// contracts, licenses and the vault's credentials, in one calendar; plus
// managing contracts (renewing one, or opening its renewal opportunity) and
// licenses.
[ApiController]
[Route("api/vencimientos")]
[Authorize]
public class VencimientosController(AppDbContext db) : ControllerBase
{
    // Everything expiring within `dias` days, and whatever already expired
    // and is still pending (contracts not renewed or ended, licenses and
    // credentials not renewed), soonest first.
    [HttpGet]
    public async Task<ActionResult<List<VencimientoItem>>> GetAll([FromQuery] int dias = 90, [FromQuery] int? empresaId = null, CancellationToken ct = default)
    {
        var hoy = Lima.Hoy;
        var limite = hoy.AddDays(Math.Clamp(dias, 1, 730));

        var contratos = await db.ContratosSoporte.AsNoTracking().Include(c => c.Empresa)
            .Where(c => c.Estado == ContratoEstado.Vigente && c.FechaFin <= limite && (empresaId == null || c.EmpresaId == empresaId))
            .ToListAsync(ct);
        var licencias = await db.Licencias.AsNoTracking().Include(l => l.Empresa).Include(l => l.Bot)
            .Where(l => l.VenceEl <= limite && (empresaId == null || l.EmpresaId == empresaId))
            .ToListAsync(ct);
        var secretos = await db.Secretos.AsNoTracking().Include(s => s.Empresa)
            .Where(s => s.VenceEl != null && s.VenceEl <= limite && (empresaId == null || s.EmpresaId == empresaId))
            .Select(s => new { s.Id, s.Nombre, s.Tipo, s.EmpresaId, EmpresaNombre = s.Empresa != null ? s.Empresa.NombreComercial : null, VenceEl = s.VenceEl!.Value })
            .ToListAsync(ct);

        var items = new List<VencimientoItem>();
        foreach (var c in contratos)
        {
            var (estado, d) = OperacionMapping.Vencimiento(c.FechaFin, hoy, OperacionMapping.DiasAvisoContrato);
            items.Add(new VencimientoItem
            {
                Tipo = "contrato", Id = c.Id, Nombre = c.Nombre, EmpresaId = c.EmpresaId, EmpresaNombre = c.Empresa?.NombreComercial,
                VenceEl = c.FechaFin, Dias = d, Estado = estado,
                Detalle = $"{OperacionMapping.Monto(c.Moneda, c.MontoMensual)} al mes",
                OportunidadRenovacionId = c.OportunidadRenovacionId,
            });
        }
        foreach (var l in licencias)
        {
            var (estado, d) = OperacionMapping.Vencimiento(l.VenceEl, hoy, OperacionMapping.DiasAvisoLicencia);
            var partes = new List<string>();
            if (l.Proveedor is not null) partes.Add(l.Proveedor);
            if (l.Cantidad > 1) partes.Add($"{l.Cantidad} unidades");
            if (l.Bot is not null) partes.Add(l.Bot.Nombre);
            partes.Add(l.PagaCliente ? "la paga el cliente" : "la paga DDS");
            items.Add(new VencimientoItem
            {
                Tipo = "licencia", Id = l.Id, Nombre = l.Nombre, EmpresaId = l.EmpresaId, EmpresaNombre = l.Empresa?.NombreComercial,
                VenceEl = l.VenceEl, Dias = d, Estado = estado, Detalle = string.Join(" · ", partes),
            });
        }
        foreach (var s in secretos)
        {
            var (estado, d) = OperacionMapping.Vencimiento(s.VenceEl, hoy, OperacionMapping.DiasAvisoLicencia);
            items.Add(new VencimientoItem
            {
                Tipo = "credencial", Id = s.Id, Nombre = s.Nombre, EmpresaId = s.EmpresaId, EmpresaNombre = s.EmpresaNombre,
                VenceEl = s.VenceEl, Dias = d, Estado = estado, Detalle = TipoSecreto(s.Tipo),
            });
        }
        return Ok(items.OrderBy(i => i.VenceEl).ThenBy(i => i.Nombre).ToList());
    }

    // --- Support contracts -----------------------------------------------------

    [HttpGet("contratos")]
    public async Task<ActionResult<List<ContratoResponse>>> GetContratos([FromQuery] int? empresaId, [FromQuery] string? estado, CancellationToken ct)
    {
        var query = db.ContratosSoporte.AsNoTracking().Include(c => c.Empresa).Include(c => c.Propuesta).Include(c => c.OportunidadRenovacion).AsQueryable();
        if (empresaId.HasValue) query = query.Where(c => c.EmpresaId == empresaId);
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(c => c.Estado == estado);
        var hoy = Lima.Hoy;
        var contratos = await query.OrderBy(c => c.Estado == ContratoEstado.Terminado).ThenBy(c => c.FechaFin).Take(500).ToListAsync(ct);
        return Ok(contratos.Select(c => OperacionMapping.ToContrato(c, hoy)).ToList());
    }

    [HttpPost("contratos")]
    public async Task<IActionResult> CreateContrato(ContratoRequest request, CancellationToken ct)
    {
        if (await ValidarContratoAsync(request, ct) is { } error) return error;
        var contrato = new ContratoSoporte { Nombre = "", Estado = ContratoEstado.Vigente, Moneda = Moneda.Soles };
        AplicarContrato(contrato, request);
        db.ContratosSoporte.Add(contrato);
        await db.SaveChangesAsync(ct);
        return Ok(new { id = contrato.Id });
    }

    [HttpPut("contratos/{cid:int}")]
    public async Task<IActionResult> UpdateContrato(int cid, ContratoRequest request, CancellationToken ct)
    {
        if (await ValidarContratoAsync(request, ct) is { } error) return error;
        var contrato = await db.ContratosSoporte.FindAsync([cid], ct);
        if (contrato is null) return NotFound();
        if (contrato.EmpresaId != request.EmpresaId) return BadRequest(new { message = "Un contrato no se cambia de empresa." });
        AplicarContrato(contrato, request);
        contrato.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // Extends it from its current end; an open renewal opportunity is won.
    [HttpPost("contratos/{cid:int}/renovar")]
    public async Task<IActionResult> RenovarContrato(int cid, RenovarContratoRequest request, CancellationToken ct)
    {
        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        var contrato = await db.ContratosSoporte.Include(c => c.OportunidadRenovacion).FirstOrDefaultAsync(c => c.Id == cid, ct);
        if (contrato is null) return NotFound();

        contrato.FechaFin = contrato.FechaFin.AddMonths(request.Meses);
        if (request.MontoMensual is { } monto) contrato.MontoMensual = Math.Round(monto, 2);
        contrato.Estado = ContratoEstado.Vigente;
        contrato.UpdatedAtUtc = DateTime.UtcNow;

        var texto = $"Contrato «{contrato.Nombre}» renovado hasta el {contrato.FechaFin:dd/MM/yyyy} ({OperacionMapping.Monto(contrato.Moneda, contrato.MontoMensual)} al mes).";
        if (contrato.OportunidadRenovacion is { } o && OportunidadEtapa.Abiertas.Contains(o.Etapa))
        {
            Embudo.Anotar(db, o, texto, autorId);
            await Embudo.CambiarEtapaAsync(db, o, OportunidadEtapa.Ganada, null, autorId, ct);
        }
        else db.Actividades.Add(new Actividad { EmpresaId = contrato.EmpresaId, Tipo = ActividadTipo.Nota, Descripcion = texto, AutorId = autorId });

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // Opens the opportunity to renew it (one open at a time), valued at a
    // year of the fee, with its next step due a month before it ends.
    [HttpPost("contratos/{cid:int}/oportunidad")]
    public async Task<IActionResult> CrearOportunidadRenovacion(int cid, CancellationToken ct)
    {
        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();
        var contrato = await db.ContratosSoporte
            .Include(c => c.OportunidadRenovacion)
            .Include(c => c.Propuesta).ThenInclude(p => p!.Oportunidad)
            .FirstOrDefaultAsync(c => c.Id == cid, ct);
        if (contrato is null) return NotFound();
        if (contrato.Estado == ContratoEstado.Terminado) return BadRequest(new { message = "El contrato está terminado." });
        if (contrato.OportunidadRenovacion is { } abierta && OportunidadEtapa.Abiertas.Contains(abierta.Etapa))
            return Conflict(new { message = "Ya hay una oportunidad abierta para renovarlo.", oportunidadId = abierta.Id });

        var servicio = await db.Bots.Where(b => b.EmpresaId == contrato.EmpresaId && b.Estado != BotEstado.Retirado)
            .GroupBy(b => b.Servicio).OrderByDescending(g => g.Count()).Select(g => g.Key).FirstOrDefaultAsync(ct) ?? ServicioTipo.Rpa;
        var hoy = Lima.Hoy;
        var titulo = $"Renovación: {contrato.Nombre}";
        var oportunidad = new Oportunidad
        {
            EmpresaId = contrato.EmpresaId,
            ContactoId = contrato.Propuesta?.Oportunidad?.ContactoId,
            Titulo = titulo.Length > 200 ? titulo[..200] : titulo,
            Servicio = servicio,
            Etapa = OportunidadEtapa.Propuesta,
            ValorEstimado = contrato.Moneda == Moneda.Soles ? contrato.MontoMensual * 12 : null,
            FechaCierreEstimada = contrato.FechaFin,
            ResponsableId = autorId,
            ProximaAccion = "Enviar la propuesta de renovación",
            ProximaAccionFecha = contrato.FechaFin.AddDays(-30) > hoy ? contrato.FechaFin.AddDays(-30) : hoy,
        };
        db.Oportunidades.Add(oportunidad);
        await db.SaveChangesAsync(ct);

        db.Actividades.Add(new Actividad
        {
            EmpresaId = oportunidad.EmpresaId,
            OportunidadId = oportunidad.Id,
            Tipo = ActividadTipo.Nota,
            Descripcion = $"Oportunidad creada para renovar el contrato «{contrato.Nombre}», que vence el {contrato.FechaFin:dd/MM/yyyy}.",
            AutorId = autorId,
        });
        contrato.OportunidadRenovacionId = oportunidad.Id;
        contrato.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new { id = oportunidad.Id });
    }

    [HttpDelete("contratos/{cid:int}")]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<IActionResult> DeleteContrato(int cid, CancellationToken ct)
    {
        var contrato = await db.ContratosSoporte.FindAsync([cid], ct);
        if (contrato is null) return NotFound();
        db.ContratosSoporte.Remove(contrato);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // --- Licenses ----------------------------------------------------------------

    [HttpGet("licencias")]
    public async Task<ActionResult<List<LicenciaResponse>>> GetLicencias([FromQuery] int? empresaId, [FromQuery] int? botId, CancellationToken ct)
    {
        var query = db.Licencias.AsNoTracking().Include(l => l.Empresa).Include(l => l.Bot).AsQueryable();
        if (empresaId.HasValue) query = query.Where(l => l.EmpresaId == empresaId);
        if (botId.HasValue) query = query.Where(l => l.BotId == botId);
        var hoy = Lima.Hoy;
        var licencias = await query.OrderBy(l => l.VenceEl).ThenBy(l => l.Nombre).Take(500).ToListAsync(ct);
        return Ok(licencias.Select(l => OperacionMapping.ToLicencia(l, hoy)).ToList());
    }

    [HttpPost("licencias")]
    public async Task<IActionResult> CreateLicencia(LicenciaRequest request, CancellationToken ct)
    {
        if (await ValidarLicenciaAsync(request, ct) is { } error) return error;
        var licencia = new Licencia { Nombre = "", Moneda = Moneda.Dolares };
        AplicarLicencia(licencia, request);
        db.Licencias.Add(licencia);
        await db.SaveChangesAsync(ct);
        return Ok(new { id = licencia.Id });
    }

    [HttpPut("licencias/{lid:int}")]
    public async Task<IActionResult> UpdateLicencia(int lid, LicenciaRequest request, CancellationToken ct)
    {
        if (await ValidarLicenciaAsync(request, ct) is { } error) return error;
        var licencia = await db.Licencias.FindAsync([lid], ct);
        if (licencia is null) return NotFound();
        AplicarLicencia(licencia, request);
        licencia.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("licencias/{lid:int}/renovar")]
    public async Task<IActionResult> RenovarLicencia(int lid, RenovarLicenciaRequest request, CancellationToken ct)
    {
        var licencia = await db.Licencias.FindAsync([lid], ct);
        if (licencia is null) return NotFound();
        if (request.VenceEl.Date <= licencia.VenceEl.Date) return BadRequest(new { message = "La nueva fecha debe ser posterior al vencimiento actual." });
        licencia.VenceEl = request.VenceEl.Date;
        licencia.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("licencias/{lid:int}")]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<IActionResult> DeleteLicencia(int lid, CancellationToken ct)
    {
        var licencia = await db.Licencias.FindAsync([lid], ct);
        if (licencia is null) return NotFound();
        db.Licencias.Remove(licencia);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // --- Helpers -------------------------------------------------------------

    private async Task<ObjectResult?> ValidarContratoAsync(ContratoRequest r, CancellationToken ct)
    {
        if (!ContratoEstado.All.Contains(r.Estado)) return BadRequest(new { message = "Estado de contrato inválido." });
        if (!Moneda.All.Contains(r.Moneda)) return BadRequest(new { message = "Moneda inválida." });
        if (r.FechaInicio == default || r.FechaFin == default) return BadRequest(new { message = "Indica el inicio y el fin del contrato." });
        if (r.FechaFin.Date < r.FechaInicio.Date) return BadRequest(new { message = "El contrato no puede terminar antes de empezar." });
        if (!await db.Empresas.AnyAsync(e => e.Id == r.EmpresaId, ct)) return BadRequest(new { message = "Elige la empresa del contrato." });
        if (r.PropuestaId.HasValue && !await db.Propuestas.AnyAsync(p => p.Id == r.PropuestaId && p.EmpresaId == r.EmpresaId, ct))
            return BadRequest(new { message = "La propuesta no es de esta empresa." });
        return null;
    }

    private static void AplicarContrato(ContratoSoporte c, ContratoRequest r)
    {
        c.EmpresaId = r.EmpresaId;
        c.PropuestaId = r.PropuestaId;
        c.Nombre = r.Nombre.Trim();
        c.Estado = r.Estado;
        c.MontoMensual = Math.Round(r.MontoMensual, 2);
        c.Moneda = r.Moneda;
        c.FechaInicio = r.FechaInicio.Date;
        c.FechaFin = r.FechaFin.Date;
        c.Notas = string.IsNullOrWhiteSpace(r.Notas) ? null : r.Notas.Trim();
    }

    private async Task<ObjectResult?> ValidarLicenciaAsync(LicenciaRequest r, CancellationToken ct)
    {
        if (!Moneda.All.Contains(r.Moneda)) return BadRequest(new { message = "Moneda inválida." });
        if (r.VenceEl == default) return BadRequest(new { message = "Indica cuándo vence la licencia." });
        if (r.EmpresaId.HasValue && !await db.Empresas.AnyAsync(e => e.Id == r.EmpresaId, ct)) return BadRequest(new { message = "La empresa no existe." });
        if (r.BotId.HasValue && !await db.Bots.AnyAsync(b => b.Id == r.BotId && b.EmpresaId == r.EmpresaId, ct))
            return BadRequest(new { message = "El bot no es de esa empresa." });
        return null;
    }

    private static void AplicarLicencia(Licencia l, LicenciaRequest r)
    {
        static string? N(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();
        l.EmpresaId = r.EmpresaId;
        l.BotId = r.BotId;
        l.Nombre = r.Nombre.Trim();
        l.Proveedor = N(r.Proveedor);
        l.Cantidad = r.Cantidad;
        l.CostoAnual = r.CostoAnual is { } c ? Math.Round(c, 2) : null;
        l.Moneda = r.Moneda;
        l.PagaCliente = r.PagaCliente;
        l.VenceEl = r.VenceEl.Date;
        l.Notas = N(r.Notas);
    }

    private static string TipoSecreto(string tipo) => tipo switch
    {
        SecretoTipo.Credencial => "Usuario y contraseña",
        SecretoTipo.ApiKey => "API key",
        SecretoTipo.Token => "Token de acceso",
        SecretoTipo.Conexion => "Cadena de conexión",
        SecretoTipo.Certificado => "Certificado",
        _ => "Nota segura",
    };
}
