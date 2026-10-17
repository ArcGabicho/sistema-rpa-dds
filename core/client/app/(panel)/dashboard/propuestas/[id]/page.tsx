import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { EliminarButton } from "@/components/comercial/eliminar-button";
import { PropuestaAcciones } from "@/components/propuesta/propuesta-acciones";
import { PropuestaEditor } from "@/components/propuesta/propuesta-editor";
import { PropuestaResumen } from "@/components/propuesta/propuesta-resumen";
import { PageHeader } from "@/components/ui/page-header";
import { BUTTON_PRIMARY, CARD } from "@/components/ui/panel-styles";
import { PropuestaEstadoBadge } from "@/components/ui/propuesta-badges";
import { apiGet } from "@/lib/api";
import type { TeamUser } from "@/lib/comercial";
import { formatDate, formatDay, todayInLima } from "@/lib/format-date";
import type { Paged } from "@/lib/comercial";
import { PROPUESTA_ESTADO_LABELS, type Propuesta } from "@/lib/propuesta";
import type { ProyectoItem } from "@/lib/proyecto";
import { puede } from "@/lib/permisos";
import { getMe } from "@/lib/session";

export default async function PropuestaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { me } = await getMe();
  const [propuesta, users, proyectos] = await Promise.all([
    apiGet<Propuesta>(`propuestas/${id}`),
    apiGet<TeamUser[]>("users"),
    /^\d+$/.test(id) && puede(me, "proyectos") ? apiGet<Paged<ProyectoItem>>(`proyectos?propuestaId=${id}&pageSize=1`) : null,
  ]);
  const editar = puede(me, "propuestas", "editar");
  if (!propuesta) notFound();
  const proyecto = proyectos?.items[0];

  const today = todayInLima();
  const nombre = `${propuesta.codigo} v${propuesta.version}`;
  const esUltima = propuesta.versiones.at(-1)?.id === propuesta.id;
  const estado =
    propuesta.estado === "borrador"
      ? "Borrador: aún no se envía."
      : propuesta.estado === "enviada"
        ? `Enviada el ${formatDate(propuesta.enviadaAtUtc!)}${propuesta.validaHasta ? ` · válida hasta el ${formatDay(propuesta.validaHasta)}` : ""}`
        : propuesta.estado === "aceptada"
          ? `Aceptada el ${formatDate(propuesta.respondidaAtUtc!)}`
          : propuesta.estado === "rechazada"
            ? `Rechazada el ${formatDate(propuesta.respondidaAtUtc!)}`
            : "Reemplazada por una versión más reciente.";

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/propuestas", label: "Propuestas" }}
        title={propuesta.titulo}
        badges={<PropuestaEstadoBadge estado={propuesta.estado} validaHasta={propuesta.validaHasta} today={today} />}
        description={
          <>
            <span className="font-mono">{nombre}</span> ·{" "}
            <Link href={`/dashboard/empresas/${propuesta.empresaId}`} className="font-medium text-ink-950 hover:underline">
              {propuesta.empresaNombre}
            </Link>
            {propuesta.oportunidadId && (
              <>
                {" · "}
                <Link href={`/dashboard/oportunidades/${propuesta.oportunidadId}`} className="hover:text-ink-950 hover:underline">
                  {propuesta.oportunidadTitulo}
                </Link>
              </>
            )}
          </>
        }
        actions={
          <>
            {propuesta.estado === "aceptada" &&
              puede(me, "proyectos") &&
              (proyecto ? (
                <Link href={`/dashboard/proyectos/${proyecto.id}`} className={BUTTON_PRIMARY}>
                  <FolderKanban className="h-4 w-4" />
                  Ver proyecto
                </Link>
              ) : (
                puede(me, "proyectos", "editar") && (
                  <Link href={`/dashboard/proyectos/nuevo?propuestaId=${propuesta.id}`} className={BUTTON_PRIMARY}>
                    <FolderKanban className="h-4 w-4" />
                    Crear proyecto
                  </Link>
                )
              ))}
            {editar && <PropuestaAcciones
              id={propuesta.id}
              estado={propuesta.estado}
              esUltima={esUltima}
              nombre={nombre}
              moneda={propuesta.moneda}
              valorPrimerAnio={propuesta.totales.valorPrimerAnio}
              conOportunidad={!!propuesta.oportunidadId}
            />}
            {me?.esAdmin && (
              <EliminarButton
                path={`propuestas/${propuesta.id}`}
                confirmText={`¿Eliminar la ${nombre}? Esta acción no se puede deshacer.`}
                redirectTo="/dashboard/propuestas"
                successTitle="Propuesta eliminada"
              />
            )}
          </>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500">
        <p>{estado}</p>
        {propuesta.motivoRechazo && (
          <p>
            <span className="font-semibold text-ink-950">Motivo:</span> {propuesta.motivoRechazo}
          </p>
        )}
        {propuesta.diagnosticoId && (
          <Link href={`/dashboard/diagnosticos/${propuesta.diagnosticoId}`} className="text-brand-700 hover:underline">
            Diagnóstico: {propuesta.diagnosticoTitulo}
          </Link>
        )}
      </div>

      {propuesta.versiones.length > 1 && (
        <nav aria-label="Versiones" className={`${CARD} mt-4 flex flex-wrap items-center gap-2 p-3 text-sm`}>
          <span className="px-2 text-ink-500">Versiones</span>
          {propuesta.versiones.map((v) => (
            <Link
              key={v.id}
              href={`/dashboard/propuestas/${v.id}`}
              aria-current={v.id === propuesta.id ? "page" : undefined}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                v.id === propuesta.id ? "bg-brand-700 text-white" : "border border-line text-ink-700 hover:bg-brand-50"
              }`}
            >
              v{v.version} · {PROPUESTA_ESTADO_LABELS[v.estado] ?? v.estado}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-6">
        {propuesta.estado === "borrador" && editar ? (
          <PropuestaEditor propuesta={propuesta} users={users ?? []} />
        ) : (
          <PropuestaResumen propuesta={propuesta} />
        )}
      </div>
    </div>
  );
}
