using Server.Data;
using Server.Models;

namespace Server.Services;

// Builds a project's plan from an accepted proposal, and keeps milestone and
// project statuses in step with their tasks. Shared by the projects API and
// the demo seeder.
public static class ProyectoPlan
{
    // The Monday on or after a date.
    public static DateTime Lunes(DateTime fecha) =>
        fecha.Date.AddDays(((int)DayOfWeek.Monday - (int)fecha.DayOfWeek + 7) % 7);

    // Milestones are the proposal's phases, back to back from the start
    // date (Monday to Friday of their last week); one process per one-off
    // line, with the diagnosis's data when the line came from it; and the
    // usual tasks of each process, under the phase where they happen.
    public static Proyecto DesdePropuesta(
        Propuesta propuesta, IReadOnlyDictionary<int, ProcesoEvaluado> origenes, DateTime inicio, int? responsableId)
    {
        var proyecto = new Proyecto
        {
            Nombre = propuesta.Titulo,
            Estado = ProyectoEstado.Planificado,
            EmpresaId = propuesta.EmpresaId,
            OportunidadId = propuesta.OportunidadId,
            PropuestaId = propuesta.Id,
            ResponsableId = responsableId,
            FechaInicio = inicio.Date,
        };

        var semana = 0;
        var orden = 0;
        foreach (var fase in propuesta.Fases.OrderBy(f => f.Orden))
        {
            var desde = inicio.Date.AddDays(semana * 7);
            semana += Math.Max(1, fase.Semanas);
            proyecto.Hitos.Add(new Hito
            {
                Nombre = fase.Nombre,
                Descripcion = fase.Descripcion,
                Estado = HitoEstado.Pendiente,
                FechaInicio = desde,
                FechaFin = inicio.Date.AddDays(semana * 7 - 3),
                Orden = ++orden,
            });
        }
        if (proyecto.Hitos.Count == 0)
        {
            proyecto.Hitos.Add(new Hito
            {
                Nombre = "Implementación", Estado = HitoEstado.Pendiente,
                FechaInicio = inicio.Date, FechaFin = inicio.Date.AddDays(4 * 7 - 3), Orden = 1,
            });
        }
        proyecto.FechaFinPlan = proyecto.Hitos.Max(h => h.FechaFin);

        var procesoOrden = 0;
        foreach (var item in propuesta.Items.Where(i => i.Tipo == PropuestaItemTipo.Implementacion).OrderBy(i => i.Orden))
        {
            var origen = item.ProcesoOrigenId is { } oid && origenes.TryGetValue(oid, out var o) ? o : null;
            proyecto.Procesos.Add(new ProcesoProyecto
            {
                ProcesoOrigenId = origen?.Id,
                Nombre = origen?.Nombre ?? SinPrefijo(item.Descripcion),
                Area = origen?.Area,
                Servicio = origen?.Servicio ?? ServicioTipo.Rpa,
                Etapa = EtapaDesarrollo.Levantamiento,
                PddEstado = PddEstado.Borrador,
                Orden = ++procesoOrden,
            });
        }

        TareasBase(proyecto, responsableId);
        return proyecto;
    }

    // Kick-off tasks, then the life cycle of each process spread over the
    // milestones in order (survey + PDD in the first, build in the second…).
    public static void TareasBase(Proyecto proyecto, int? responsableId)
    {
        var hitos = proyecto.Hitos.OrderBy(h => h.Orden).ToList();
        Hito HitoN(int n) => hitos[Math.Min(n, hitos.Count - 1)];
        var orden = proyecto.Tareas.Count;

        void Agregar(string titulo, Hito hito) => proyecto.Tareas.Add(new Tarea
        {
            Titulo = titulo,
            Hito = hito,
            Estado = TareaEstado.Pendiente,
            ResponsableId = responsableId,
            FechaLimite = hito.FechaFin,
            Orden = ++orden,
        });

        Agregar("Reunión de inicio con el cliente", HitoN(0));
        Agregar("Accesos a los sistemas del cliente registrados en la Bóveda", HitoN(0));
        foreach (var p in proyecto.Procesos.OrderBy(p => p.Orden))
        {
            Agregar($"Levantamiento del proceso actual: {p.Nombre}", HitoN(0));
            Agregar($"PDD de {p.Nombre} aprobado por el cliente", HitoN(0));
            Agregar($"Desarrollo: {p.Nombre}", HitoN(1));
            Agregar($"Pruebas con el usuario: {p.Nombre}", HitoN(2));
            Agregar($"Puesta en producción: {p.Nombre}", HitoN(3));
        }
    }

    // A milestone with tasks follows them: all done → completed; any started
    // → in progress; none → pending. A planned project starts once any task
    // does.
    public static void Sincronizar(Proyecto proyecto, Hito? hito)
    {
        if (hito is not null)
        {
            var tareas = proyecto.Tareas.Where(t => t.HitoId == hito.Id || t.Hito == hito).ToList();
            if (tareas.Count > 0)
            {
                var estado = tareas.All(t => t.Estado == TareaEstado.Hecha) ? HitoEstado.Completado
                    : tareas.Any(t => t.Estado != TareaEstado.Pendiente) ? HitoEstado.EnCurso
                    : HitoEstado.Pendiente;
                if (estado != hito.Estado)
                {
                    hito.Estado = estado;
                    hito.CompletadoAtUtc = estado == HitoEstado.Completado ? DateTime.UtcNow : null;
                }
            }
        }

        if (proyecto.Estado == ProyectoEstado.Planificado && proyecto.Tareas.Any(t => t.Estado != TareaEstado.Pendiente))
            proyecto.Estado = ProyectoEstado.EnCurso;
    }

    private static string SinPrefijo(string descripcion)
    {
        var i = descripcion.IndexOf(": ", StringComparison.Ordinal);
        return i > 0 && i < 30 ? descripcion[(i + 2)..] : descripcion;
    }
}
