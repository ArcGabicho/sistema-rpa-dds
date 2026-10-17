import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { KpiStrip } from "@/components/resumen/resumen-ui";
import { CARD } from "@/components/ui/panel-styles";
import { formatDay } from "@/lib/format-date";

export type EntregaResumen = {
  proyectosActivos: number;
  proyectosAtrasados: number;
  tareasBloqueadas: number;
  tareasVencidas: number;
  pddEnRevision: number;
  procesosSinBot: number;
  hitos: { proyectoId: number; proyectoNombre: string; empresaNombre: string; hito: string; fechaFin: string; atrasado: boolean }[];
};

// Delivery on the summary: what's active, what's stuck, what's due.
export function SeccionEntrega({ data }: { data: EntregaResumen }) {
  return (
    <>
      <KpiStrip
        kpis={[
          { label: "Proyectos activos", valor: data.proyectosActivos },
          { label: "Atrasados", valor: data.proyectosAtrasados, alerta: data.proyectosAtrasados > 0, detalle: "con un hito o el fin ya vencidos" },
          {
            label: "Tareas bloqueadas",
            valor: data.tareasBloqueadas,
            alerta: data.tareasBloqueadas > 0,
            detalle: data.tareasVencidas > 0 ? `${data.tareasVencidas} tareas pasadas de fecha` : "ninguna pasada de fecha",
          },
          {
            label: "PDD por aprobar",
            valor: data.pddEnRevision,
            detalle: data.procesosSinBot > 0 ? `${data.procesosSinBot} procesos listos sin su bot registrado` : "esperando la firma del cliente",
          },
        ]}
      />
      <section className={`${CARD} mt-6 p-6`}>
        <h3 className="text-base font-semibold text-ink-950">Hitos de las próximas dos semanas</h3>
        {data.hitos.length === 0 ? (
          <p className="mt-3 border-t border-line pt-4 text-sm text-ink-500">Ningún hito vence en las próximas dos semanas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {data.hitos.map((h) => (
              <li key={`${h.proyectoId}-${h.hito}`}>
                <Link href={`/dashboard/proyectos/${h.proyectoId}`} className="group flex items-center justify-between gap-4 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink-950 group-hover:underline">{h.hito}</span>
                    <span className="block truncate text-xs text-ink-500">
                      {h.proyectoNombre} · {h.empresaNombre}
                    </span>
                  </span>
                  <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-medium ${h.atrasado ? "text-red-600" : "text-ink-500"}`}>
                    <CalendarClock className="h-3.5 w-3.5" />
                    {h.atrasado ? `Venció el ${formatDay(h.fechaFin)}` : `Vence el ${formatDay(h.fechaFin)}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
