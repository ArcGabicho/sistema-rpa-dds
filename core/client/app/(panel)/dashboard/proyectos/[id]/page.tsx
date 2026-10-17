import Link from "next/link";
import { notFound } from "next/navigation";
import { EliminarButton } from "@/components/comercial/eliminar-button";
import { Cronograma } from "@/components/proyecto/cronograma";
import { ProcesosProyecto } from "@/components/proyecto/procesos-proyecto";
import { ProyectoAjustes } from "@/components/proyecto/proyecto-ajustes";
import { TareasPanel } from "@/components/proyecto/tareas-panel";
import { SoloLectura } from "@/components/permisos/solo-lectura";
import { PageHeader } from "@/components/ui/page-header";
import { CARD } from "@/components/ui/panel-styles";
import { ProyectoEstadoBadge } from "@/components/ui/proyecto-badges";
import { apiGet } from "@/lib/api";
import type { TeamUser } from "@/lib/comercial";
import { formatDay, todayInLima } from "@/lib/format-date";
import { progreso, type Proyecto } from "@/lib/proyecto";
import { puede } from "@/lib/permisos";
import { getMe } from "@/lib/session";

export default async function ProyectoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [proyecto, users, { me }] = await Promise.all([apiGet<Proyecto>(`proyectos/${id}`), apiGet<TeamUser[]>("users"), getMe()]);
  if (!proyecto) notFound();
  const editar = puede(me, "proyectos", "editar");

  const today = todayInLima();
  const pct = progreso(proyecto);
  const vencidas = proyecto.tareas.filter((t) => t.vencida).length;
  const kpis: [string, string, string?][] = [
    ["Avance", `${pct}%`, `${proyecto.tareasHechas} de ${proyecto.tareasTotal} tareas`],
    ["Hito actual", proyecto.hitoActual ?? "—", undefined],
    ["Bloqueadas", String(proyecto.tareasBloqueadas), vencidas > 0 ? `${vencidas} vencidas` : undefined],
    [proyecto.fechaFinReal ? "Terminó" : "Fin planificado", formatDay(proyecto.fechaFinReal ?? proyecto.fechaFinPlan), `Inicio ${formatDay(proyecto.fechaInicio)}`],
  ];

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/proyectos", label: "Proyectos" }}
        title={proyecto.nombre}
        badges={<ProyectoEstadoBadge estado={proyecto.estado} atrasado={proyecto.atrasado} />}
        description={
          <>
            <Link href={`/dashboard/empresas/${proyecto.empresaId}`} className="font-medium text-ink-950 hover:underline">
              {proyecto.empresaNombre}
            </Link>
            {proyecto.propuestaId && (
              <>
                {" · "}
                <Link href={`/dashboard/propuestas/${proyecto.propuestaId}`} className="hover:text-ink-950 hover:underline">
                  Propuesta {proyecto.propuestaNombre}
                </Link>
              </>
            )}
            {proyecto.oportunidadId && (
              <>
                {" · "}
                <Link href={`/dashboard/oportunidades/${proyecto.oportunidadId}`} className="hover:text-ink-950 hover:underline">
                  {proyecto.oportunidadTitulo}
                </Link>
              </>
            )}
          </>
        }
        actions={
          me?.esAdmin && (
            <EliminarButton
              path={`proyectos/${proyecto.id}`}
              confirmText={`¿Eliminar el proyecto “${proyecto.nombre}” con sus hitos, tareas y PDDs? Esta acción no se puede deshacer.`}
              redirectTo="/dashboard/proyectos"
              successTitle="Proyecto eliminado"
            />
          )
        }
      />

      <dl className={`${CARD} mt-8 grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-4`}>
        {kpis.map(([label, value, detalle]) => (
          <div key={label} className="min-w-0 bg-white p-4 sm:p-5">
            <dt className="text-xs text-ink-500">{label}</dt>
            <dd className="mt-1.5 truncate font-display text-xl font-semibold tracking-tight text-ink-950" title={value}>
              {value}
            </dd>
            {detalle && <dd className="mt-0.5 text-xs text-ink-400">{detalle}</dd>}
          </div>
        ))}
      </dl>

      <section className={`${CARD} mt-6 p-6`}>
        <h2 className="text-base font-semibold text-ink-950">Cronograma</h2>
        <div className="mt-4">
          <Cronograma hitos={proyecto.hitos} inicio={proyecto.fechaInicio} fin={proyecto.fechaFinPlan} today={today} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <SoloLectura activo={!editar} aviso="Solo lectura: tu acceso a Proyectos no permite cambiar tareas ni hitos.">
            <TareasPanel proyectoId={proyecto.id} hitos={proyecto.hitos} tareas={proyecto.tareas} users={users ?? []} />
          </SoloLectura>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <ProcesosProyecto
            proyectoId={proyecto.id}
            procesos={proyecto.procesosLista}
            puedeAgregar={editar}
            verBots={puede(me, "operacion")}
            puedeRegistrarBot={puede(me, "operacion", "editar")}
          />
          {editar && <ProyectoAjustes proyecto={proyecto} users={users ?? []} />}
        </div>
      </div>
    </div>
  );
}
