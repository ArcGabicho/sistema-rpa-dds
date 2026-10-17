import Link from "next/link";
import { Ban, CalendarClock } from "lucide-react";
import { ProximaAccionLabel } from "@/components/comercial/proxima-accion-label";
import { SeveridadBadge, SlaBadge } from "@/components/ui/operacion-badges";
import { CARD } from "@/components/ui/panel-styles";
import { formatDay } from "@/lib/format-date";
import type { IncidenciaItem } from "@/lib/operacion";

export type MiTrabajo = {
  tareas: { id: number; titulo: string; proyectoId: number; proyectoNombre: string; estado: string; fechaLimite: string | null; vencida: boolean; bloqueo: string | null }[] | null;
  tareasTotal: number;
  acciones: { oportunidadId: number; titulo: string; empresaNombre: string; proximaAccion: string; proximaAccionFecha: string }[] | null;
  accionesTotal: number;
  incidencias: IncidenciaItem[] | null;
  incidenciasTotal: number;
};

function Lista({ titulo, total, vacio, href, children, mostrados }: { titulo: string; total: number; vacio: string; href: string; children: React.ReactNode; mostrados: number }) {
  return (
    <section className={`${CARD} flex min-w-0 flex-col p-5`}>
      <h3 className="text-sm font-semibold text-ink-950">
        {titulo} <span className="font-normal text-ink-500">{total}</span>
      </h3>
      {total === 0 ? <p className="mt-3 border-t border-line pt-3 text-sm text-ink-500">{vacio}</p> : <ul className="mt-3 divide-y divide-line border-t border-line">{children}</ul>}
      {total > mostrados && (
        <Link href={href} className="mt-auto pt-3 text-xs font-medium text-brand-700 hover:underline">
          y {total - mostrados} más
        </Link>
      )}
    </section>
  );
}

// What's assigned to the signed-in user, in the modules they can see.
// `ahora` is the server's clock for the SLA countdowns.
export function MiTrabajoPanel({ data, today, ahora }: { data: MiTrabajo; today: string; ahora: number }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {data.tareas && (
        <Lista titulo="Mis tareas" total={data.tareasTotal} vacio="No tienes tareas abiertas en proyectos." href="/dashboard/proyectos" mostrados={data.tareas.length}>
          {data.tareas.map((t) => (
            <li key={t.id}>
              <Link href={`/dashboard/proyectos/${t.proyectoId}`} className="group block py-2.5">
                <p className="text-sm font-medium text-ink-950 group-hover:underline">{t.titulo}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
                  <span className="truncate">{t.proyectoNombre}</span>
                  {t.estado === "bloqueada" && (
                    <span className="inline-flex items-center gap-1 font-medium text-red-600">
                      <Ban className="h-3 w-3" />
                      Bloqueada
                    </span>
                  )}
                  {t.fechaLimite && (
                    <span className={`inline-flex items-center gap-1 ${t.vencida ? "font-medium text-red-600" : ""}`}>
                      <CalendarClock className="h-3 w-3" />
                      {t.vencida ? `Venció el ${formatDay(t.fechaLimite)}` : formatDay(t.fechaLimite)}
                    </span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </Lista>
      )}
      {data.acciones && (
        <Lista titulo="Mis seguimientos de la semana" total={data.accionesTotal} vacio="No tienes seguimientos para esta semana." href="/dashboard/oportunidades?mias=1" mostrados={data.acciones.length}>
          {data.acciones.map((a) => (
            <li key={a.oportunidadId}>
              <Link href={`/dashboard/oportunidades/${a.oportunidadId}`} className="group block py-2.5">
                <p className="truncate text-sm font-medium text-ink-950 group-hover:underline">
                  {a.titulo}
                  <span className="font-normal text-ink-500"> · {a.empresaNombre}</span>
                </p>
                <div className="mt-1">
                  <ProximaAccionLabel accion={a.proximaAccion} fecha={a.proximaAccionFecha} today={today} />
                </div>
              </Link>
            </li>
          ))}
        </Lista>
      )}
      {data.incidencias && (
        <Lista titulo="Mis incidencias" total={data.incidenciasTotal} vacio="No tienes incidencias abiertas." href="/dashboard/incidencias" mostrados={data.incidencias.length}>
          {data.incidencias.map((i) => (
            <li key={i.id}>
              <Link href={`/dashboard/incidencias/${i.id}`} className="group block py-2.5">
                <p className="text-sm font-medium text-ink-950 group-hover:underline">{i.titulo}</p>
                <p className="mt-0.5 truncate text-xs text-ink-500">{[i.botNombre, i.empresaNombre].filter(Boolean).join(" · ")}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <SeveridadBadge severidad={i.severidad} />
                  <SlaBadge sla={i.sla} ahora={ahora} />
                </div>
              </Link>
            </li>
          ))}
        </Lista>
      )}
    </div>
  );
}
