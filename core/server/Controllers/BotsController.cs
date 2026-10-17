using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

// Bots in production: what each one saves each month against the estimate
// (Services/Ahorro.cs), and its health (open incidents, failed runs).
[ApiController]
[Route("api/bots")]
[Authorize]
public class BotsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResponse<BotListItem>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? estado,
        [FromQuery] int? empresaId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var hoy = Lima.Hoy;
        var ultimoMes = Ahorro.UltimoMesCerrado(hoy);

        var query = db.Bots.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(b => b.Nombre.Contains(term) || (b.Plataforma != null && b.Plataforma.Contains(term)) || (b.Empresa != null && b.Empresa.NombreComercial.Contains(term)));
        }
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(b => b.Estado == estado);
        if (empresaId.HasValue) query = query.Where(b => b.EmpresaId == empresaId);

        var totalCount = await query.CountAsync(ct);
        var bots = await query
            .Include(b => b.Empresa)
            .Include(b => b.Responsable)
            .Include(b => b.Mediciones.Where(m => m.Mes == ultimoMes))
            .OrderBy(b => b.Estado == BotEstado.Activo ? 0 : b.Estado == BotEstado.EnPausa ? 1 : 2)
            .ThenBy(b => b.Empresa!.NombreComercial)
            .ThenBy(b => b.Nombre)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(ct);

        var salud = await SaludAsync(bots.Select(b => b.Id).ToList(), ct);
        return Ok(PagedResponse<BotListItem>.Create(bots.Select(b => Llenar(new BotListItem(), b, salud, hoy)).ToList(), page, pageSize, totalCount));
    }

    // The headline figures: last closed month's real saving against the
    // estimate, and the monthly series for the chart (last twelve months).
    [HttpGet("resumen")]
    public async Task<ActionResult<BotsResumenResponse>> GetResumen(CancellationToken ct)
    {
        var hoy = Lima.Hoy;
        var mes = Ahorro.UltimoMesCerrado(hoy);
        var bots = await db.Bots.AsNoTracking().Include(b => b.Mediciones).AsSplitQuery().ToListAsync(ct);

        var filas = bots.SelectMany(b => b.Mediciones.Select(m => (m.Mes, Calculo: Ahorro.Calcular(b, m)))).ToList();
        var delMes = filas.Where(f => f.Mes == mes).ToList();
        var real = delMes.Sum(f => f.Calculo.AhorroReal);
        var estimado = delMes.Sum(f => f.Calculo.AhorroEstimado);

        var desde = mes.AddMonths(-11);
        if (filas.Count > 0 && filas.Min(f => f.Mes) > desde) desde = filas.Min(f => f.Mes);
        var serie = new List<SerieMes>();
        for (var m = desde; m <= mes; m = m.AddMonths(1))
        {
            var esos = filas.Where(f => f.Mes == m).ToList();
            serie.Add(new SerieMes { Mes = m, Real = esos.Sum(f => f.Calculo.AhorroReal), Estimado = esos.Sum(f => f.Calculo.AhorroEstimado) });
        }

        return Ok(new BotsResumenResponse
        {
            Activos = bots.Count(b => b.Estado == BotEstado.Activo),
            EnPausa = bots.Count(b => b.Estado == BotEstado.EnPausa),
            Mes = mes,
            AhorroRealMes = real,
            AhorroEstimadoMes = estimado,
            CumplimientoMes = estimado > 0 ? Math.Round(real / estimado, 3) : null,
            SinRegistro = bots.Count(b => SinRegistro(b, b.Mediciones.Any(m => m.Mes == mes), hoy)),
            AhorroRealAcumulado = filas.Sum(f => f.Calculo.AhorroReal),
            HorasAcumuladas = filas.Sum(f => f.Calculo.HorasAhorradas),
            Serie = serie,
        });
    }

    // What the new-bot form starts from for a process: its company, and the
    // figures of the diagnosis it came from.
    [HttpGet("borrador")]
    public async Task<ActionResult<BorradorBotResponse>> GetBorrador([FromQuery] int procesoId, CancellationToken ct)
    {
        var p = await db.ProcesosProyecto.AsNoTracking()
            .Include(x => x.Proyecto).ThenInclude(y => y!.Empresa)
            .FirstOrDefaultAsync(x => x.Id == procesoId, ct);
        if (p is null) return NotFound();

        var borrador = new BorradorBotResponse
        {
            Nombre = p.Nombre,
            EmpresaId = p.Proyecto!.EmpresaId,
            EmpresaNombre = p.Proyecto.Empresa?.NombreComercial ?? "—",
            ProyectoId = p.ProyectoId,
            ProyectoNombre = p.Proyecto.Nombre,
            ProcesoProyectoId = p.Id,
            Servicio = p.Servicio,
            DesdeDiagnostico = false,
            BotExistenteId = await db.Bots.Where(b => b.ProcesoProyectoId == p.Id).Select(b => (int?)b.Id).FirstOrDefaultAsync(ct),
        };
        if (p.ProcesoOrigenId is { } oid && await db.ProcesosEvaluados.AsNoTracking().Include(x => x.Diagnostico).FirstOrDefaultAsync(x => x.Id == oid, ct) is { } origen)
        {
            var costoHora = origen.CostoHora ?? origen.Diagnostico!.CostoHora;
            borrador.HorasMesEstimadas = Roi.Calcular(origen, origen.Diagnostico!.CostoHora).HorasLiberadasMes;
            borrador.CostoHora = costoHora;
            borrador.MinutosPorCaso = origen.MinutosPorEjecucion;
            borrador.DesdeDiagnostico = true;
        }
        return Ok(borrador);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BotResponse>> GetById(int id, CancellationToken ct)
    {
        var b = await db.Bots.AsNoTracking()
            .Include(x => x.Empresa)
            .Include(x => x.Proyecto)
            .Include(x => x.ProcesoProyecto)
            .Include(x => x.Responsable)
            .Include(x => x.Mediciones)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (b is null) return NotFound();

        var hoy = Lima.Hoy;
        var ahora = DateTime.UtcNow;
        var salud = await SaludAsync([b.Id], ct);
        var incidencias = await db.Incidencias.AsNoTracking()
            .Include(i => i.Empresa).Include(i => i.Bot).Include(i => i.Responsable)
            .Where(i => i.BotId == id)
            .OrderBy(i => i.ResueltaAtUtc != null).ThenByDescending(i => i.CreatedAtUtc)
            .Take(8)
            .ToListAsync(ct);
        var licencias = await db.Licencias.AsNoTracking()
            .Include(l => l.Empresa).Include(l => l.Bot)
            .Where(l => l.BotId == id)
            .OrderBy(l => l.VenceEl)
            .ToListAsync(ct);

        var mediciones = b.Mediciones.OrderBy(m => m.Mes).Select(m => ToMedicion(b, m)).ToList();
        var registrados = b.Mediciones.Select(m => m.Mes).ToHashSet();
        var real = mediciones.Sum(m => m.AhorroReal);
        var estimado = mediciones.Sum(m => m.AhorroEstimado);

        var r = Llenar(new BotResponse(), b, salud, hoy);
        r.Descripcion = b.Descripcion;
        r.ProyectoId = b.ProyectoId;
        r.ProyectoNombre = b.Proyecto?.Nombre;
        r.ProcesoProyectoId = b.ProcesoProyectoId;
        r.ProcesoNombre = b.ProcesoProyecto?.Nombre;
        r.Horario = b.Horario;
        r.RetiradoEl = b.RetiradoEl;
        r.ResponsableId = b.ResponsableId;
        r.HorasMesEstimadas = b.HorasMesEstimadas;
        r.CostoHora = b.CostoHora;
        r.MinutosPorCaso = b.MinutosPorCaso;
        r.Mediciones = mediciones;
        r.Acumulado = new AcumuladoBot
        {
            Meses = mediciones.Count,
            HorasAhorradas = mediciones.Sum(m => m.HorasAhorradas),
            AhorroReal = real,
            AhorroEstimado = estimado,
            Cumplimiento = estimado > 0 ? Math.Round(real / estimado, 3) : null,
        };
        r.MesesSinRegistro = Ahorro.MesesEnProduccion(b, hoy).Where(m => !registrados.Contains(m)).ToList();
        r.Incidencias = incidencias.Select(i => OperacionMapping.LlenarIncidencia(new IncidenciaListItem(), i, ahora)).ToList();
        r.Licencias = licencias.Select(l => OperacionMapping.ToLicencia(l, hoy)).ToList();
        return Ok(r);
    }

    // From a project's process (one bot each): the process moves to
    // production and its launch task is ticked off. Or for a company.
    [HttpPost]
    public async Task<IActionResult> Create(CreateBotRequest request, CancellationToken ct)
    {
        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();
        if (await ValidarAsync(request, ct) is { } error) return error;

        var bot = new Bot { Nombre = "", Servicio = request.Servicio, Estado = BotEstado.Activo };
        Aplicar(bot, request);
        bot.ResponsableId ??= autorId;
        int? oportunidadId = null;

        if (request.ProcesoProyectoId is { } procesoId)
        {
            var proceso = await db.ProcesosProyecto.Include(p => p.Proyecto).FirstOrDefaultAsync(p => p.Id == procesoId, ct);
            if (proceso is null) return BadRequest(new { message = "El proceso no existe." });
            if (await db.Bots.Where(b => b.ProcesoProyectoId == procesoId).Select(b => (int?)b.Id).FirstOrDefaultAsync(ct) is { } existente)
                return Conflict(new { message = "Este proceso ya tiene su bot.", botId = existente });

            bot.EmpresaId = proceso.Proyecto!.EmpresaId;
            bot.ProyectoId = proceso.ProyectoId;
            bot.ProcesoProyectoId = proceso.Id;
            oportunidadId = proceso.Proyecto.OportunidadId;
            proceso.Etapa = EtapaDesarrollo.Produccion;
            proceso.UpdatedAtUtc = DateTime.UtcNow;
            await MarcarPuestaEnProduccionAsync(proceso, ct);
        }
        else
        {
            if (request.EmpresaId is null || !await db.Empresas.AnyAsync(e => e.Id == request.EmpresaId, ct))
                return BadRequest(new { message = "Elige la empresa del bot." });
            bot.EmpresaId = request.EmpresaId.Value;
        }

        db.Bots.Add(bot);
        db.Actividades.Add(new Actividad
        {
            EmpresaId = bot.EmpresaId,
            OportunidadId = oportunidadId,
            Tipo = ActividadTipo.Nota,
            Descripcion = $"Bot «{bot.Nombre}» en producción desde el {bot.EnProduccionDesde:dd/MM/yyyy}.",
            AutorId = autorId,
        });
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = bot.Id }, new { id = bot.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateBotRequest request, CancellationToken ct)
    {
        if (!BotEstado.All.Contains(request.Estado))
            return BadRequest(new { message = $"Estado inválido. Usa uno de: {string.Join(", ", BotEstado.All)}." });
        if (await ValidarAsync(request, ct) is { } error) return error;
        if (request.RetiradoEl is { } retiro && retiro.Date < request.EnProduccionDesde.Date)
            return BadRequest(new { message = "No puede retirarse antes de entrar en producción." });

        var bot = await db.Bots.FindAsync([id], ct);
        if (bot is null) return NotFound();

        Aplicar(bot, request);
        bot.RetiradoEl = request.Estado == BotEstado.Retirado ? (request.RetiradoEl ?? bot.RetiradoEl ?? Lima.Hoy).Date : null;
        bot.Estado = request.Estado;
        bot.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var bot = await db.Bots.FindAsync([id], ct);
        if (bot is null) return NotFound();

        // Its incidents and licenses stay with the company, unlinked.
        await db.Incidencias.Where(i => i.BotId == id).ExecuteUpdateAsync(set => set.SetProperty(i => i.BotId, (int?)null), ct);
        await db.Licencias.Where(l => l.BotId == id).ExecuteUpdateAsync(set => set.SetProperty(l => l.BotId, (int?)null), ct);
        db.Bots.Remove(bot);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // --- Monthly records -------------------------------------------------------

    // Creates or replaces the month's record.
    [HttpPut("{id:int}/mediciones")]
    public async Task<ActionResult<MedicionResponse>> SetMedicion(int id, MedicionRequest request, CancellationToken ct)
    {
        var bot = await db.Bots.Include(b => b.Mediciones).FirstOrDefaultAsync(b => b.Id == id, ct);
        if (bot is null) return NotFound();

        var mes = new DateTime(request.Mes.Year, request.Mes.Month, 1);
        var hoy = Lima.Hoy;
        if (mes < new DateTime(bot.EnProduccionDesde.Year, bot.EnProduccionDesde.Month, 1))
            return BadRequest(new { message = "El bot aún no estaba en producción ese mes." });
        if (mes > new DateTime(hoy.Year, hoy.Month, 1))
            return BadRequest(new { message = "Ese mes todavía no llega." });
        if (request.EjecucionesFallidas > request.Ejecuciones)
            return BadRequest(new { message = "Las ejecuciones fallidas no pueden ser más que las ejecuciones." });

        var medicion = bot.Mediciones.FirstOrDefault(m => m.Mes == mes);
        if (medicion is null)
        {
            medicion = new MedicionBot { Mes = mes };
            bot.Mediciones.Add(medicion);
        }
        medicion.Ejecuciones = request.Ejecuciones;
        medicion.EjecucionesFallidas = request.EjecucionesFallidas;
        medicion.CasosProcesados = request.CasosProcesados;
        medicion.CasosDerivados = request.CasosDerivados;
        medicion.Notas = string.IsNullOrWhiteSpace(request.Notas) ? null : request.Notas.Trim();
        medicion.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(ToMedicion(bot, medicion));
    }

    [HttpDelete("{id:int}/mediciones/{anio:int}/{mes:int}")]
    public async Task<IActionResult> DeleteMedicion(int id, int anio, int mes, CancellationToken ct)
    {
        if (mes is < 1 or > 12) return NotFound();
        var fecha = new DateTime(anio, mes, 1);
        var medicion = await db.MedicionesBot.FirstOrDefaultAsync(m => m.BotId == id && m.Mes == fecha, ct);
        if (medicion is null) return NotFound();
        db.MedicionesBot.Remove(medicion);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // --- Helpers -------------------------------------------------------------

    private sealed record Salud(int Abiertas, bool ConFalla);

    private async Task<Dictionary<int, Salud>> SaludAsync(List<int> ids, CancellationToken ct)
    {
        var abiertas = await db.Incidencias.AsNoTracking()
            .Where(i => i.BotId != null && ids.Contains(i.BotId.Value) && IncidenciaEstado.Abiertas.Contains(i.Estado))
            .Select(i => new { BotId = i.BotId!.Value, i.Severidad })
            .ToListAsync(ct);
        return abiertas.GroupBy(i => i.BotId).ToDictionary(
            g => g.Key,
            g => new Salud(g.Count(), g.Any(i => i.Severidad is Severidad.Critica or Severidad.Alta)));
    }

    private static T Llenar<T>(T r, Bot b, IReadOnlyDictionary<int, Salud> salud, DateTime hoy) where T : BotListItem
    {
        var ultimoMes = Ahorro.UltimoMesCerrado(hoy);
        var ultimo = b.Mediciones.FirstOrDefault(m => m.Mes == ultimoMes);
        var s = salud.GetValueOrDefault(b.Id);
        r.Id = b.Id;
        r.Nombre = b.Nombre;
        r.EmpresaId = b.EmpresaId;
        r.EmpresaNombre = b.Empresa?.NombreComercial ?? "—";
        r.Servicio = b.Servicio;
        r.Plataforma = b.Plataforma;
        r.Estado = b.Estado;
        r.ResponsableNombre = b.Responsable?.FullName;
        r.EnProduccionDesde = b.EnProduccionDesde;
        r.AhorroMensualEstimado = Ahorro.EstimadoMensual(b);
        r.IncidenciasAbiertas = s?.Abiertas ?? 0;
        r.ConFalla = s?.ConFalla ?? false;
        r.UltimoMes = ultimoMes;
        r.Ultimo = ultimo is null ? null : ToMedicion(b, ultimo);
        r.SinRegistro = SinRegistro(b, ultimo is not null, hoy);
        return r;
    }

    private static bool SinRegistro(Bot b, bool registrado, DateTime hoy) =>
        b.Estado == BotEstado.Activo && !registrado && Ahorro.MesesEnProduccion(b, hoy).Contains(Ahorro.UltimoMesCerrado(hoy));

    private static MedicionResponse ToMedicion(Bot b, MedicionBot m)
    {
        var c = Ahorro.Calcular(b, m);
        return new MedicionResponse
        {
            Mes = m.Mes,
            Ejecuciones = m.Ejecuciones,
            EjecucionesFallidas = m.EjecucionesFallidas,
            CasosProcesados = m.CasosProcesados,
            CasosDerivados = m.CasosDerivados,
            Notas = m.Notas,
            HorasAhorradas = c.HorasAhorradas,
            AhorroReal = c.AhorroReal,
            AhorroEstimado = c.AhorroEstimado,
            Cumplimiento = c.Cumplimiento,
            TasaExito = c.TasaExito,
        };
    }

    private async Task<ObjectResult?> ValidarAsync(BotRequest r, CancellationToken ct)
    {
        if (!ServicioTipo.All.Contains(r.Servicio))
            return BadRequest(new { message = $"Servicio inválido. Usa uno de: {string.Join(", ", ServicioTipo.All)}." });
        if (r.ResponsableId.HasValue && !await db.AdminUsers.AnyAsync(u => u.Id == r.ResponsableId, ct))
            return BadRequest(new { message = "El responsable no existe." });
        if (r.EnProduccionDesde == default) return BadRequest(new { message = "Indica desde cuándo está en producción." });
        return null;
    }

    private static void Aplicar(Bot b, BotRequest r)
    {
        static string? N(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();
        b.Nombre = r.Nombre.Trim();
        b.Descripcion = N(r.Descripcion);
        b.Servicio = r.Servicio;
        b.Plataforma = N(r.Plataforma);
        b.Horario = N(r.Horario);
        b.EnProduccionDesde = r.EnProduccionDesde.Date;
        b.ResponsableId = r.ResponsableId;
        b.HorasMesEstimadas = Math.Round(r.HorasMesEstimadas, 2);
        b.CostoHora = Math.Round(r.CostoHora, 2);
        b.MinutosPorCaso = Math.Round(r.MinutosPorCaso, 2);
    }

    // Ticks off "Puesta en producción: …", the process's last task.
    private async Task MarcarPuestaEnProduccionAsync(ProcesoProyecto p, CancellationToken ct)
    {
        var titulo = $"Puesta en producción: {p.Nombre}";
        var proyecto = await db.Proyectos.Include(x => x.Tareas).Include(x => x.Hitos).AsSplitQuery().FirstAsync(x => x.Id == p.ProyectoId, ct);
        foreach (var tarea in proyecto.Tareas.Where(t => t.Titulo == titulo && t.Estado != TareaEstado.Hecha))
        {
            tarea.Estado = TareaEstado.Hecha;
            tarea.CompletadaAtUtc = DateTime.UtcNow;
            tarea.Bloqueo = null;
            ProyectoPlan.Sincronizar(proyecto, proyecto.Hitos.FirstOrDefault(h => h.Id == tarea.HitoId));
        }
        proyecto.UpdatedAtUtc = DateTime.UtcNow;
    }
}
