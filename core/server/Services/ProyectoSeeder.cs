using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services;

// Demo projects for local development (Seed:DatosDemo): one per accepted
// demo proposal, starting the Monday after it was accepted, with progress
// that matches today's date — finished milestones done, the current one
// half way (sometimes late, sometimes blocked), the rest pending. Processes
// past the survey have an approved PDD (PddPlantillas); some in the survey
// only have notes, ready to try the AI draft.
public static class ProyectoSeeder
{
    private const int Semilla = 20261020;

    private static readonly string[] Bloqueos =
    [
        "Esperando los accesos de prueba del cliente.",
        "El cliente aún no envía los documentos de muestra.",
        "Falta confirmar quién aprueba el PDD por parte del cliente.",
    ];

    public static async Task SeedAsync(AppDbContext db, IConfiguration config, ILogger logger, CancellationToken ct = default)
    {
        if (!config.GetValue<bool>("Seed:DatosDemo")) return;
        if (await db.Proyectos.AnyAsync(ct)) return;

        var autorId = await db.AdminUsers.OrderBy(u => u.Id).Select(u => (int?)u.Id).FirstOrDefaultAsync(ct);
        var propuestas = await db.Propuestas
            .Include(p => p.Items)
            .Include(p => p.Fases)
            .Include(p => p.Oportunidad).ThenInclude(o => o!.Contacto)
            .Where(p => p.Estado == PropuestaEstado.Aceptada)
            .OrderBy(p => p.Id)
            .AsSplitQuery()
            .ToListAsync(ct);
        var ids = propuestas.SelectMany(p => p.Items).Where(i => i.ProcesoOrigenId != null).Select(i => i.ProcesoOrigenId!.Value).ToList();
        var origenes = await db.ProcesosEvaluados.AsNoTracking().Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);

        var rnd = new Random(Semilla);
        var hoy = Lima.Hoy;
        var proyectos = new List<Proyecto>();
        var notas = new List<Actividad>();

        foreach (var propuesta in propuestas)
        {
            var aceptada = propuesta.RespondidaAtUtc ?? propuesta.UpdatedAtUtc;
            var inicio = ProyectoPlan.Lunes(Lima.DesdeUtc(aceptada).Date.AddDays(1));
            var proyecto = ProyectoPlan.DesdePropuesta(propuesta, origenes, inicio, autorId);
            proyecto.CreatedAtUtc = proyecto.UpdatedAtUtc = aceptada.AddHours(rnd.Next(2, 30));

            // Sometimes the current milestone runs a couple of weeks late.
            var hitos = proyecto.Hitos.OrderBy(h => h.Orden).ToList();
            var retraso = rnd.NextDouble() < 0.3 ? rnd.Next(4, 15) : 0;
            var actual = hitos.FindIndex(h => h.FechaFin.AddDays(retraso) >= hoy);
            if (actual < 0) actual = hitos.Count;

            for (var i = 0; i < hitos.Count; i++)
            {
                var hito = hitos[i];
                var tareas = proyecto.Tareas.Where(t => t.Hito == hito).OrderBy(t => t.Orden).ToList();
                if (i < actual)
                {
                    hito.Estado = HitoEstado.Completado;
                    hito.CompletadoAtUtc = Lima.AUtc(Min(hito.FechaFin, hoy.AddDays(-1)).AddHours(17));
                    foreach (var t in tareas) Hecha(t, hito, rnd);
                }
                else if (i == actual && hito.FechaInicio <= hoy)
                {
                    hito.Estado = HitoEstado.EnCurso;
                    var hechas = tareas.Count / 2;
                    for (var k = 0; k < tareas.Count; k++)
                    {
                        if (k < hechas) Hecha(tareas[k], hito, rnd);
                        else if (k == hechas) tareas[k].Estado = TareaEstado.EnProgreso;
                        else if (k == hechas + 1 && rnd.NextDouble() < 0.35)
                        {
                            tareas[k].Estado = TareaEstado.Bloqueada;
                            tareas[k].Bloqueo = Bloqueos[rnd.Next(Bloqueos.Length)];
                        }
                    }
                }
            }

            proyecto.Estado = actual >= hitos.Count ? ProyectoEstado.Completado
                : hitos[0].FechaInicio <= hoy ? ProyectoEstado.EnCurso
                : ProyectoEstado.Planificado;
            if (proyecto.Estado == ProyectoEstado.Completado) proyecto.FechaFinReal = Min(hitos[^1].FechaFin.AddDays(rnd.Next(0, 6)), hoy);

            var etapa = actual switch
            {
                0 => EtapaDesarrollo.Levantamiento,
                1 => EtapaDesarrollo.Desarrollo,
                2 => EtapaDesarrollo.Pruebas,
                _ => EtapaDesarrollo.Produccion,
            };
            var contacto = propuesta.Oportunidad?.Contacto;
            var aprobador = contacto is null ? "Responsable del área" : $"{contacto.Nombres} {contacto.Apellidos}".Trim();

            foreach (var p in proyecto.Procesos)
            {
                p.Etapa = etapa;
                var plantilla = PddPlantillas.Para(p.Nombre);
                if (plantilla is null) continue;

                if (actual > 0)
                {
                    Llenar(p, plantilla);
                    p.PddEstado = PddEstado.Aprobado;
                    p.PddAprobadoPor = aprobador;
                    p.PddAprobadoAtUtc = Lima.AUtc(hitos[0].FechaFin.AddDays(-1).AddHours(16));
                }
                else if (hitos[0].FechaInicio <= hoy)
                {
                    // In the survey: notes taken; half of them have a first draft.
                    p.NotasLevantamiento = plantilla.Notas;
                    if (rnd.NextDouble() < 0.5)
                    {
                        p.PddObjetivo = plantilla.Objetivo;
                        p.PddPasosActuales = string.Join("\n", plantilla.Actuales);
                    }
                }
            }

            if (propuesta.Oportunidad is { } o)
                notas.Add(new Actividad
                {
                    EmpresaId = o.EmpresaId,
                    OportunidadId = o.Id,
                    Tipo = ActividadTipo.Nota,
                    Descripcion = $"Proyecto «{proyecto.Nombre}» creado; empieza el {inicio:dd/MM/yyyy}.",
                    AutorId = autorId,
                    CreatedAtUtc = proyecto.CreatedAtUtc,
                });
            proyectos.Add(proyecto);
        }

        db.Proyectos.AddRange(proyectos);
        db.Actividades.AddRange(notas);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Datos demo: {Proyectos} proyectos.", proyectos.Count);
    }

    private static void Hecha(Tarea t, Hito hito, Random rnd)
    {
        t.Estado = TareaEstado.Hecha;
        var dias = Math.Max(0, (hito.FechaFin - hito.FechaInicio).Days);
        t.CompletadaAtUtc = Lima.AUtc(Min(hito.FechaInicio.AddDays(rnd.Next(0, dias + 1)), Lima.Hoy.AddDays(-1)).AddHours(rnd.Next(9, 19)));
    }

    private static void Llenar(ProcesoProyecto p, PddPlantillas.Plantilla t)
    {
        static string L(IEnumerable<string> items) => string.Join("\n", items);
        p.NotasLevantamiento = t.Notas;
        p.PddObjetivo = t.Objetivo;
        p.PddAlcance = t.Alcance;
        p.PddSistemas = L(t.Sistemas);
        p.PddEntradas = L(t.Entradas);
        p.PddSalidas = L(t.Salidas);
        p.PddPasosActuales = L(t.Actuales);
        p.PddReglas = L(t.Reglas);
        p.PddExcepciones = L(t.Excepciones);
        p.PddPasosPropuestos = L(t.Propuestos);
        p.PddPreguntas = L(t.Preguntas);
    }

    private static DateTime Min(DateTime a, DateTime b) => a < b ? a : b;
}
