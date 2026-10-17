using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

// Projects: the delivery of an accepted proposal. Milestones follow their
// tasks (see ProyectoPlan.Sincronizar); each process carries its PDD, which
// can be drafted with AI and is approved by the client.
[ApiController]
[Route("api/proyectos")]
[Authorize]
public class ProyectosController(AppDbContext db, IaRedactor ia) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResponse<ProyectoListItem>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? estado,
        [FromQuery] int? empresaId,
        [FromQuery] int? oportunidadId,
        [FromQuery] int? propuestaId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Proyectos.AsNoTracking();
        if (propuestaId.HasValue) query = query.Where(p => p.PropuestaId == propuestaId);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(p => p.Nombre.Contains(term) || (p.Empresa != null && p.Empresa.NombreComercial.Contains(term)));
        }
        if (estado == "activos") query = query.Where(p => p.Estado == ProyectoEstado.Planificado || p.Estado == ProyectoEstado.EnCurso || p.Estado == ProyectoEstado.EnPausa);
        else if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(p => p.Estado == estado);
        if (empresaId.HasValue) query = query.Where(p => p.EmpresaId == empresaId);
        if (oportunidadId.HasValue) query = query.Where(p => p.OportunidadId == oportunidadId);

        var totalCount = await query.CountAsync(ct);
        var proyectos = await query
            .Include(p => p.Empresa)
            .Include(p => p.Responsable)
            .Include(p => p.Hitos)
            .Include(p => p.Tareas)
            .Include(p => p.Procesos)
            .OrderBy(p => p.Estado == ProyectoEstado.Completado || p.Estado == ProyectoEstado.Cancelado)
            .ThenBy(p => p.FechaFinPlan)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(ct);

        var hoy = Lima.Hoy;
        return Ok(PagedResponse<ProyectoListItem>.Create(proyectos.Select(p => Llenar(new ProyectoListItem(), p, hoy)).ToList(), page, pageSize, totalCount));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProyectoResponse>> GetById(int id, CancellationToken ct)
    {
        var p = await db.Proyectos
            .AsNoTracking()
            .Include(x => x.Empresa)
            .Include(x => x.Oportunidad)
            .Include(x => x.Propuesta)
            .Include(x => x.Responsable)
            .Include(x => x.Hitos)
            .Include(x => x.Tareas).ThenInclude(t => t.Responsable)
            .Include(x => x.Procesos)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return NotFound();

        var hoy = Lima.Hoy;
        var r = Llenar(new ProyectoResponse
        {
            Hitos = p.Hitos.OrderBy(h => h.Orden).Select(h => new HitoResponse
            {
                Id = h.Id, Nombre = h.Nombre, Descripcion = h.Descripcion, Estado = h.Estado,
                FechaInicio = h.FechaInicio, FechaFin = h.FechaFin, CompletadoAtUtc = h.CompletadoAtUtc,
                Atrasado = HitoAtrasado(h, hoy),
            }).ToList(),
            Tareas = p.Tareas.OrderBy(t => t.Orden).Select(t => ToTarea(t, hoy)).ToList(),
            ProcesosLista = p.Procesos.OrderBy(x => x.Orden).Select(x => new ProcesoProyectoItem
            {
                Id = x.Id, Nombre = x.Nombre, Area = x.Area, Servicio = x.Servicio, Etapa = x.Etapa,
                PddEstado = x.PddEstado, PddVersion = x.PddVersion,
                TienePdd = !string.IsNullOrWhiteSpace(x.PddObjetivo) || !string.IsNullOrWhiteSpace(x.PddPasosActuales),
            }).ToList(),
        }, p, hoy);
        r.Descripcion = p.Descripcion;
        r.OportunidadId = p.OportunidadId;
        r.OportunidadTitulo = p.Oportunidad?.Titulo;
        r.PropuestaId = p.PropuestaId;
        r.PropuestaNombre = p.Propuesta is null ? null : $"{p.Propuesta.Codigo} v{p.Propuesta.Version}";
        r.ResponsableId = p.ResponsableId;
        return Ok(r);
    }

    // From an accepted proposal (one project per proposal), or blank.
    [HttpPost]
    public async Task<IActionResult> Create(CreateProyectoRequest request, CancellationToken ct)
    {
        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();
        var responsableId = request.ResponsableId ?? autorId;
        if (request.ResponsableId.HasValue && !await db.AdminUsers.AnyAsync(u => u.Id == request.ResponsableId, ct))
            return BadRequest(new { message = "El responsable no existe." });
        var inicio = (request.FechaInicio ?? ProyectoPlan.Lunes(Lima.Hoy.AddDays(1))).Date;

        Proyecto proyecto;
        if (request.PropuestaId.HasValue)
        {
            var propuesta = await db.Propuestas.Include(p => p.Items).Include(p => p.Fases).AsSplitQuery()
                .FirstOrDefaultAsync(p => p.Id == request.PropuestaId, ct);
            if (propuesta is null) return BadRequest(new { message = "La propuesta no existe." });
            if (propuesta.Estado != PropuestaEstado.Aceptada)
                return BadRequest(new { message = "Solo se crea un proyecto a partir de una propuesta aceptada." });
            if (await db.Proyectos.Where(p => p.PropuestaId == propuesta.Id).Select(p => (int?)p.Id).FirstOrDefaultAsync(ct) is { } existente)
                return Conflict(new { message = "Esta propuesta ya tiene su proyecto.", proyectoId = existente });

            var ids = propuesta.Items.Where(i => i.ProcesoOrigenId != null).Select(i => i.ProcesoOrigenId!.Value).ToList();
            var origenes = await db.ProcesosEvaluados.AsNoTracking().Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
            proyecto = ProyectoPlan.DesdePropuesta(propuesta, origenes, inicio, responsableId);
            if (!string.IsNullOrWhiteSpace(request.Nombre)) proyecto.Nombre = request.Nombre.Trim();
        }
        else
        {
            if (request.EmpresaId is null || !await db.Empresas.AnyAsync(e => e.Id == request.EmpresaId, ct))
                return BadRequest(new { message = "Elige la empresa del proyecto." });
            proyecto = new Proyecto
            {
                Nombre = string.IsNullOrWhiteSpace(request.Nombre) ? "Proyecto de automatización" : request.Nombre.Trim(),
                Estado = ProyectoEstado.Planificado,
                EmpresaId = request.EmpresaId.Value,
                ResponsableId = responsableId,
                FechaInicio = inicio,
                FechaFinPlan = inicio.AddDays(4 * 7 - 3),
            };
            proyecto.Hitos.Add(new Hito
            {
                Nombre = "Implementación", Estado = HitoEstado.Pendiente, FechaInicio = inicio, FechaFin = proyecto.FechaFinPlan, Orden = 1,
            });
        }

        db.Proyectos.Add(proyecto);
        if (proyecto.OportunidadId is { } oportunidadId && await db.Oportunidades.FindAsync([oportunidadId], ct) is { } oportunidad)
            Embudo.Anotar(db, oportunidad, $"Proyecto «{proyecto.Nombre}» creado; empieza el {proyecto.FechaInicio:dd/MM/yyyy}.", autorId);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = proyecto.Id }, new { id = proyecto.Id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateProyectoRequest request, CancellationToken ct)
    {
        if (!ProyectoEstado.All.Contains(request.Estado))
            return BadRequest(new { message = $"Estado inválido. Usa uno de: {string.Join(", ", ProyectoEstado.All)}." });
        if (request.FechaFinPlan.Date < request.FechaInicio.Date)
            return BadRequest(new { message = "El fin planificado no puede ser antes del inicio." });
        if (request.ResponsableId.HasValue && !await db.AdminUsers.AnyAsync(u => u.Id == request.ResponsableId, ct))
            return BadRequest(new { message = "El responsable no existe." });

        var proyecto = await db.Proyectos.FindAsync([id], ct);
        if (proyecto is null) return NotFound();

        proyecto.Nombre = request.Nombre.Trim();
        proyecto.Descripcion = Normalize(request.Descripcion);
        proyecto.FechaInicio = request.FechaInicio.Date;
        proyecto.FechaFinPlan = request.FechaFinPlan.Date;
        proyecto.ResponsableId = request.ResponsableId;
        if (request.Estado == ProyectoEstado.Completado && proyecto.Estado != ProyectoEstado.Completado) proyecto.FechaFinReal = Lima.Hoy;
        else if (request.Estado != ProyectoEstado.Completado) proyecto.FechaFinReal = null;
        proyecto.Estado = request.Estado;
        proyecto.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        // Loaded with its children: tasks point at milestones with a NoAction
        // FK, so EF deletes them in order rather than leaving it to the cascade.
        var proyecto = await db.Proyectos.Include(p => p.Tareas).Include(p => p.Hitos).Include(p => p.Procesos)
            .AsSplitQuery().FirstOrDefaultAsync(p => p.Id == id, ct);
        if (proyecto is null) return NotFound();

        db.Proyectos.Remove(proyecto);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // --- Milestones --------------------------------------------------------

    [HttpPost("{id:int}/hitos")]
    public async Task<IActionResult> AddHito(int id, HitoRequest request, CancellationToken ct)
    {
        var proyecto = await db.Proyectos.Include(p => p.Hitos).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (proyecto is null) return NotFound();
        if (ValidarHito(request) is { } error) return error;

        var hito = new Hito { Nombre = "", Estado = HitoEstado.Pendiente, Orden = proyecto.Hitos.Count == 0 ? 1 : proyecto.Hitos.Max(h => h.Orden) + 1 };
        AplicarHito(hito, request);
        proyecto.Hitos.Add(hito);
        AjustarFin(proyecto);
        await db.SaveChangesAsync(ct);
        return Ok(new { id = hito.Id });
    }

    [HttpPut("hitos/{hid:int}")]
    public async Task<IActionResult> UpdateHito(int hid, HitoRequest request, CancellationToken ct)
    {
        var hito = await db.Hitos.Include(h => h.Proyecto).ThenInclude(p => p!.Hitos).FirstOrDefaultAsync(h => h.Id == hid, ct);
        if (hito is null) return NotFound();
        if (ValidarHito(request) is { } error) return error;

        AplicarHito(hito, request);
        AjustarFin(hito.Proyecto!);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // Its tasks stay in the project, without a milestone.
    [HttpDelete("hitos/{hid:int}")]
    public async Task<IActionResult> DeleteHito(int hid, CancellationToken ct)
    {
        var hito = await db.Hitos.FindAsync([hid], ct);
        if (hito is null) return NotFound();

        await db.Tareas.Where(t => t.HitoId == hid).ExecuteUpdateAsync(set => set.SetProperty(t => t.HitoId, (int?)null), ct);
        db.Hitos.Remove(hito);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // --- Tasks -------------------------------------------------------------

    [HttpPost("{id:int}/tareas")]
    public async Task<ActionResult<TareaResponse>> AddTarea(int id, TareaRequest request, CancellationToken ct)
    {
        var proyecto = await db.Proyectos.Include(p => p.Tareas).Include(p => p.Hitos).AsSplitQuery().FirstOrDefaultAsync(p => p.Id == id, ct);
        if (proyecto is null) return NotFound();
        if (await ValidarTareaAsync(request, proyecto, ct) is { } error) return error;

        var tarea = new Tarea { Titulo = "", Estado = TareaEstado.Pendiente, Orden = proyecto.Tareas.Count == 0 ? 1 : proyecto.Tareas.Max(t => t.Orden) + 1 };
        AplicarTarea(tarea, request);
        proyecto.Tareas.Add(tarea);
        ProyectoPlan.Sincronizar(proyecto, proyecto.Hitos.FirstOrDefault(h => h.Id == tarea.HitoId));
        proyecto.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(ToTarea(tarea, Lima.Hoy));
    }

    [HttpPut("tareas/{tid:int}")]
    public async Task<IActionResult> UpdateTarea(int tid, TareaRequest request, CancellationToken ct)
    {
        var tarea = await db.Tareas.FindAsync([tid], ct);
        if (tarea is null) return NotFound();
        var proyecto = await db.Proyectos.Include(p => p.Tareas).Include(p => p.Hitos).AsSplitQuery().FirstAsync(p => p.Id == tarea.ProyectoId, ct);
        if (await ValidarTareaAsync(request, proyecto, ct) is { } error) return error;

        var hitoAnterior = tarea.HitoId;
        AplicarTarea(tarea, request);
        ProyectoPlan.Sincronizar(proyecto, proyecto.Hitos.FirstOrDefault(h => h.Id == tarea.HitoId));
        if (hitoAnterior != tarea.HitoId) ProyectoPlan.Sincronizar(proyecto, proyecto.Hitos.FirstOrDefault(h => h.Id == hitoAnterior));
        proyecto.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("tareas/{tid:int}")]
    public async Task<IActionResult> DeleteTarea(int tid, CancellationToken ct)
    {
        var tarea = await db.Tareas.FindAsync([tid], ct);
        if (tarea is null) return NotFound();
        var proyecto = await db.Proyectos.Include(p => p.Tareas).Include(p => p.Hitos).AsSplitQuery().FirstAsync(p => p.Id == tarea.ProyectoId, ct);

        proyecto.Tareas.Remove(tarea);
        db.Tareas.Remove(tarea);
        ProyectoPlan.Sincronizar(proyecto, proyecto.Hitos.FirstOrDefault(h => h.Id == tarea.HitoId));
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // --- Processes and their PDD ---------------------------------------------

    [HttpPost("{id:int}/procesos")]
    public async Task<IActionResult> AddProceso(int id, CreateProcesoProyectoRequest request, CancellationToken ct)
    {
        if (!ServicioTipo.All.Contains(request.Servicio))
            return BadRequest(new { message = $"Servicio inválido. Usa uno de: {string.Join(", ", ServicioTipo.All)}." });
        var proyecto = await db.Proyectos.Include(p => p.Procesos).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (proyecto is null) return NotFound();

        var proceso = new ProcesoProyecto
        {
            Nombre = request.Nombre.Trim(),
            Area = Normalize(request.Area),
            Servicio = request.Servicio,
            Etapa = EtapaDesarrollo.Levantamiento,
            PddEstado = PddEstado.Borrador,
            Orden = proyecto.Procesos.Count == 0 ? 1 : proyecto.Procesos.Max(p => p.Orden) + 1,
        };
        proyecto.Procesos.Add(proceso);
        await db.SaveChangesAsync(ct);
        return Ok(new { id = proceso.Id });
    }

    [HttpGet("procesos/{pid:int}")]
    public async Task<ActionResult<ProcesoProyectoResponse>> GetProceso(int pid, CancellationToken ct)
    {
        var p = await db.ProcesosProyecto.AsNoTracking()
            .Include(x => x.Proyecto).ThenInclude(y => y!.Empresa)
            .Include(x => x.Proyecto).ThenInclude(y => y!.Oportunidad).ThenInclude(o => o!.Contacto)
            .FirstOrDefaultAsync(x => x.Id == pid, ct);
        if (p is null) return NotFound();

        ProcesoEvaluado? origen = null;
        decimal? costoHora = null;
        if (p.ProcesoOrigenId is { } oid)
        {
            origen = await db.ProcesosEvaluados.AsNoTracking().FirstOrDefaultAsync(x => x.Id == oid, ct);
            if (origen is not null) costoHora = await db.Diagnosticos.Where(d => d.Id == origen.DiagnosticoId).Select(d => (decimal?)d.CostoHora).FirstOrDefaultAsync(ct);
        }
        var contacto = p.Proyecto?.Oportunidad?.Contacto;

        return Ok(new ProcesoProyectoResponse
        {
            Id = p.Id,
            ProyectoId = p.ProyectoId,
            ProyectoNombre = p.Proyecto?.Nombre ?? "—",
            EmpresaId = p.Proyecto?.EmpresaId ?? 0,
            EmpresaNombre = p.Proyecto?.Empresa?.NombreComercial ?? "—",
            ContactoNombre = contacto is null ? null : $"{contacto.Nombres} {contacto.Apellidos}".Trim(),
            Nombre = p.Nombre,
            Area = p.Area,
            Servicio = p.Servicio,
            Etapa = p.Etapa,
            NotasLevantamiento = p.NotasLevantamiento,
            PddEstado = p.PddEstado,
            PddObjetivo = p.PddObjetivo,
            PddAlcance = p.PddAlcance,
            PddSistemas = p.PddSistemas,
            PddEntradas = p.PddEntradas,
            PddSalidas = p.PddSalidas,
            PddPasosActuales = p.PddPasosActuales,
            PddReglas = p.PddReglas,
            PddExcepciones = p.PddExcepciones,
            PddPasosPropuestos = p.PddPasosPropuestos,
            PddPreguntas = p.PddPreguntas,
            PddConIa = p.PddConIa,
            PddAprobadoPor = p.PddAprobadoPor,
            PddAprobadoAtUtc = p.PddAprobadoAtUtc,
            PddVersion = p.PddVersion,
            UpdatedAtUtc = p.UpdatedAtUtc,
            EjecucionesMes = origen?.EjecucionesMes,
            MinutosPorEjecucion = origen?.MinutosPorEjecucion,
            Personas = origen?.Personas,
            HorasLiberadasMes = origen is null || costoHora is null ? null : Roi.Calcular(origen, costoHora.Value).HorasLiberadasMes,
            ComoSeHaceHoy = origen?.Descripcion,
        });
    }

    // Changing an approved PDD makes a new version, back to draft until the
    // client approves it again. Approving it ticks off its approval task.
    [HttpPut("procesos/{pid:int}")]
    public async Task<IActionResult> UpdateProceso(int pid, UpdateProcesoProyectoRequest request, CancellationToken ct)
    {
        if (!ServicioTipo.All.Contains(request.Servicio)) return BadRequest(new { message = "Servicio inválido." });
        if (!EtapaDesarrollo.All.Contains(request.Etapa)) return BadRequest(new { message = "Etapa inválida." });
        if (!PddEstado.All.Contains(request.PddEstado)) return BadRequest(new { message = "Estado del PDD inválido." });

        var p = await db.ProcesosProyecto.FirstOrDefaultAsync(x => x.Id == pid, ct);
        if (p is null) return NotFound();

        string?[] Contenido(ProcesoProyecto x) => [x.PddObjetivo, x.PddAlcance, x.PddSistemas, x.PddEntradas, x.PddSalidas, x.PddPasosActuales, x.PddReglas, x.PddExcepciones, x.PddPasosPropuestos, x.PddPreguntas];
        var antes = Contenido(p);
        var nombreAnterior = p.Nombre;

        p.Nombre = request.Nombre.Trim();
        p.Area = Normalize(request.Area);
        p.Servicio = request.Servicio;
        p.Etapa = request.Etapa;
        p.NotasLevantamiento = Normalize(request.NotasLevantamiento);
        p.PddObjetivo = Normalize(request.PddObjetivo);
        p.PddAlcance = Normalize(request.PddAlcance);
        p.PddSistemas = Normalize(request.PddSistemas);
        p.PddEntradas = Normalize(request.PddEntradas);
        p.PddSalidas = Normalize(request.PddSalidas);
        p.PddPasosActuales = Normalize(request.PddPasosActuales);
        p.PddReglas = Normalize(request.PddReglas);
        p.PddExcepciones = Normalize(request.PddExcepciones);
        p.PddPasosPropuestos = Normalize(request.PddPasosPropuestos);
        p.PddPreguntas = Normalize(request.PddPreguntas);
        var cambio = !antes.SequenceEqual(Contenido(p));

        var estado = request.PddEstado;
        if (p.PddEstado == PddEstado.Aprobado && cambio)
        {
            p.PddVersion++;
            p.PddConIa = request.PddConIa;
            estado = estado == PddEstado.Aprobado ? PddEstado.Borrador : estado;
        }
        else if (request.PddConIa) p.PddConIa = true;

        if (estado == PddEstado.Aprobado && p.PddEstado != PddEstado.Aprobado)
        {
            if (string.IsNullOrWhiteSpace(request.PddAprobadoPor))
                return BadRequest(new { message = "Indica quién del cliente aprobó el PDD." });
            p.PddAprobadoPor = request.PddAprobadoPor.Trim();
            p.PddAprobadoAtUtc = DateTime.UtcNow;
            await MarcarAprobacionAsync(p, nombreAnterior, ct);
        }
        else if (estado != PddEstado.Aprobado)
        {
            p.PddAprobadoPor = null;
            p.PddAprobadoAtUtc = null;
        }
        p.PddEstado = estado;
        p.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("procesos/{pid:int}")]
    public async Task<IActionResult> DeleteProceso(int pid, CancellationToken ct)
    {
        var p = await db.ProcesosProyecto.FindAsync([pid], ct);
        if (p is null) return NotFound();
        db.ProcesosProyecto.Remove(p);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("ia")]
    public ActionResult<IaEstadoResponse> GetIa() => Ok(new IaEstadoResponse { Configurada = ia.Configurada, Modelo = ia.Modelo });

    // An AI draft of the PDD from the process's data and what's in the editor
    // now (the notes may not be saved yet). Nothing is saved: the editor
    // fills its fields with it, for the consultant to review.
    [HttpPost("procesos/{pid:int}/pdd-ia")]
    [EnableRateLimiting(RateLimiting.Ia)]
    public async Task<ActionResult<BorradorPddResponse>> RedactarPdd(int pid, UpdateProcesoProyectoRequest editor, CancellationToken ct)
    {
        if (!ia.Configurada)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "La redacción con IA no está configurada: falta ANTHROPIC_API_KEY en el servidor." });

        var p = await db.ProcesosProyecto.AsNoTracking()
            .Include(x => x.Proyecto).ThenInclude(y => y!.Empresa)
            .FirstOrDefaultAsync(x => x.Id == pid, ct);
        if (p is null) return NotFound();
        var origen = p.ProcesoOrigenId is { } oid ? await db.ProcesosEvaluados.AsNoTracking().FirstOrDefaultAsync(x => x.Id == oid, ct) : null;

        var actual = new Dictionary<string, string>();
        void Seccion(string nombre, string? texto) { if (!string.IsNullOrWhiteSpace(texto)) actual[nombre] = texto.Trim(); }
        Seccion("Objetivo", editor.PddObjetivo);
        Seccion("Alcance", editor.PddAlcance);
        Seccion("Sistemas", editor.PddSistemas);
        Seccion("Entradas", editor.PddEntradas);
        Seccion("Salidas", editor.PddSalidas);
        Seccion("Pasos actuales", editor.PddPasosActuales);
        Seccion("Reglas de negocio", editor.PddReglas);
        Seccion("Excepciones", editor.PddExcepciones);
        Seccion("Pasos propuestos", editor.PddPasosPropuestos);
        Seccion("Preguntas abiertas", editor.PddPreguntas);

        try
        {
            var b = await ia.RedactarPddAsync(new IaRedactor.ContextoPdd(
                p.Proyecto?.Empresa?.NombreComercial ?? "—",
                p.Proyecto?.Empresa?.Rubro,
                editor.Nombre,
                editor.Area ?? p.Area,
                ServicioTipo.Label(editor.Servicio),
                origen?.Descripcion,
                origen?.EjecucionesMes,
                origen?.MinutosPorEjecucion,
                origen?.Personas,
                origen?.TasaError,
                editor.NotasLevantamiento,
                actual), ct);

            static string Lineas(IEnumerable<string> items) => string.Join("\n", items.Select(i => i.Trim()).Where(i => i.Length > 0));
            return Ok(new BorradorPddResponse
            {
                PddObjetivo = b.Objetivo.Trim(),
                PddAlcance = b.Alcance.Trim(),
                PddSistemas = Lineas(b.Sistemas),
                PddEntradas = Lineas(b.Entradas),
                PddSalidas = Lineas(b.Salidas),
                PddPasosActuales = Lineas(b.PasosActuales),
                PddReglas = Lineas(b.Reglas),
                PddExcepciones = Lineas(b.Excepciones.Select(e => $"{e.Caso.Trim()} → {e.Tratamiento.Trim()}")),
                PddPasosPropuestos = Lineas(b.PasosPropuestos),
                PddPreguntas = Lineas(b.Preguntas),
                Modelo = ia.Modelo,
            });
        }
        catch (IaRedactor.IaException e)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = e.Message });
        }
    }

    // --- Helpers -------------------------------------------------------------

    private async Task MarcarAprobacionAsync(ProcesoProyecto p, string nombreAnterior, CancellationToken ct)
    {
        var titulos = new[] { $"PDD de {p.Nombre} aprobado por el cliente", $"PDD de {nombreAnterior} aprobado por el cliente" };
        var proyecto = await db.Proyectos.Include(x => x.Tareas).Include(x => x.Hitos).AsSplitQuery().FirstAsync(x => x.Id == p.ProyectoId, ct);
        foreach (var tarea in proyecto.Tareas.Where(t => titulos.Contains(t.Titulo) && t.Estado != TareaEstado.Hecha))
        {
            tarea.Estado = TareaEstado.Hecha;
            tarea.CompletadaAtUtc = DateTime.UtcNow;
            tarea.Bloqueo = null;
            ProyectoPlan.Sincronizar(proyecto, proyecto.Hitos.FirstOrDefault(h => h.Id == tarea.HitoId));
        }
    }

    private static T Llenar<T>(T r, Proyecto p, DateTime hoy) where T : ProyectoListItem
    {
        r.Id = p.Id;
        r.Nombre = p.Nombre;
        r.EmpresaId = p.EmpresaId;
        r.EmpresaNombre = p.Empresa?.NombreComercial ?? "—";
        r.Estado = p.Estado;
        r.ResponsableNombre = p.Responsable?.FullName;
        r.FechaInicio = p.FechaInicio;
        r.FechaFinPlan = p.FechaFinPlan;
        r.FechaFinReal = p.FechaFinReal;
        r.TareasTotal = p.Tareas.Count;
        r.TareasHechas = p.Tareas.Count(t => t.Estado == TareaEstado.Hecha);
        r.TareasBloqueadas = p.Tareas.Count(t => t.Estado == TareaEstado.Bloqueada);
        r.Procesos = p.Procesos.Count;
        var abierto = p.Estado is not (ProyectoEstado.Completado or ProyectoEstado.Cancelado);
        r.Atrasado = abierto && (p.FechaFinPlan < hoy || p.Hitos.Any(h => HitoAtrasado(h, hoy)));
        r.HitoActual = abierto ? p.Hitos.OrderBy(h => h.Orden).FirstOrDefault(h => h.Estado != HitoEstado.Completado)?.Nombre : null;
        return r;
    }

    private static bool HitoAtrasado(Hito h, DateTime hoy) => h.Estado != HitoEstado.Completado && h.FechaFin < hoy;

    private static TareaResponse ToTarea(Tarea t, DateTime hoy) => new()
    {
        Id = t.Id,
        Titulo = t.Titulo,
        HitoId = t.HitoId,
        Estado = t.Estado,
        ResponsableId = t.ResponsableId,
        ResponsableNombre = t.Responsable?.FullName,
        FechaLimite = t.FechaLimite,
        Bloqueo = t.Bloqueo,
        CompletadaAtUtc = t.CompletadaAtUtc,
        Vencida = t.Estado != TareaEstado.Hecha && t.FechaLimite < hoy,
    };

    private ObjectResult? ValidarHito(HitoRequest r)
    {
        if (!HitoEstado.All.Contains(r.Estado)) return BadRequest(new { message = "Estado de hito inválido." });
        if (r.FechaFin.Date < r.FechaInicio.Date) return BadRequest(new { message = "El hito no puede terminar antes de empezar." });
        return null;
    }

    private static void AplicarHito(Hito h, HitoRequest r)
    {
        h.Nombre = r.Nombre.Trim();
        h.Descripcion = string.IsNullOrWhiteSpace(r.Descripcion) ? null : r.Descripcion.Trim();
        h.FechaInicio = r.FechaInicio.Date;
        h.FechaFin = r.FechaFin.Date;
        if (h.Estado != r.Estado) h.CompletadoAtUtc = r.Estado == HitoEstado.Completado ? DateTime.UtcNow : null;
        h.Estado = r.Estado;
    }

    // The planned end follows the last milestone when they move later.
    private static void AjustarFin(Proyecto p)
    {
        if (p.Hitos.Count > 0 && p.Hitos.Max(h => h.FechaFin) > p.FechaFinPlan) p.FechaFinPlan = p.Hitos.Max(h => h.FechaFin);
    }

    private async Task<ObjectResult?> ValidarTareaAsync(TareaRequest r, Proyecto proyecto, CancellationToken ct)
    {
        if (!TareaEstado.All.Contains(r.Estado)) return BadRequest(new { message = "Estado de tarea inválido." });
        if (r.HitoId.HasValue && proyecto.Hitos.All(h => h.Id != r.HitoId)) return BadRequest(new { message = "El hito no es de este proyecto." });
        if (r.ResponsableId.HasValue && !await db.AdminUsers.AnyAsync(u => u.Id == r.ResponsableId, ct))
            return BadRequest(new { message = "El responsable no existe." });
        if (r.Estado == TareaEstado.Bloqueada && string.IsNullOrWhiteSpace(r.Bloqueo))
            return BadRequest(new { message = "Anota qué está bloqueando la tarea." });
        return null;
    }

    private static void AplicarTarea(Tarea t, TareaRequest r)
    {
        t.Titulo = r.Titulo.Trim();
        t.HitoId = r.HitoId;
        t.ResponsableId = r.ResponsableId;
        t.FechaLimite = r.FechaLimite?.Date;
        t.Bloqueo = r.Estado == TareaEstado.Bloqueada ? r.Bloqueo?.Trim() : null;
        if (t.Estado != r.Estado) t.CompletadaAtUtc = r.Estado == TareaEstado.Hecha ? DateTime.UtcNow : null;
        t.Estado = r.Estado;
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
