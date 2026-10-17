import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { ActividadTimeline } from "@/components/comercial/actividad-timeline";
import { EliminarButton } from "@/components/comercial/eliminar-button";
import { EtapaStepper } from "@/components/comercial/etapa-stepper";
import { OportunidadDiagnosticos } from "@/components/diagnostico/oportunidad-diagnosticos";
import { OportunidadPropuestas } from "@/components/propuesta/oportunidad-propuestas";
import { OportunidadProyecto } from "@/components/proyecto/oportunidad-proyecto";
import { ProximaAccionCard } from "@/components/comercial/proxima-accion-card";
import { SoloLectura } from "@/components/permisos/solo-lectura";
import { EtapaBadge } from "@/components/ui/comercial-badges";
import { PageHeader } from "@/components/ui/page-header";
import { BUTTON_SECONDARY, CARD } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import { SERVICIO_LABELS, formatSoles, fullName, type Oportunidad, type Paged } from "@/lib/comercial";
import type { DiagnosticoItem } from "@/lib/diagnostico";
import type { PropuestaListItem } from "@/lib/propuesta";
import type { ProyectoItem } from "@/lib/proyecto";
import { formatDate, formatDateTime, formatDay, todayInLima } from "@/lib/format-date";
import { puede } from "@/lib/permisos";
import { getMe } from "@/lib/session";

export default async function OportunidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const valido = /^\d+$/.test(id);
  const { me } = await getMe();
  // Each linked module only when the user can see it.
  const [oportunidad, diagnosticos, propuestas, proyectos] = await Promise.all([
    apiGet<Oportunidad>(`oportunidades/${id}`),
    valido && puede(me, "diagnosticos") ? apiGet<Paged<DiagnosticoItem>>(`diagnosticos?oportunidadId=${id}&pageSize=10`) : null,
    valido && puede(me, "propuestas") ? apiGet<Paged<PropuestaListItem>>(`propuestas?oportunidadId=${id}&pageSize=10`) : null,
    valido && puede(me, "proyectos") ? apiGet<Paged<ProyectoItem>>(`proyectos?oportunidadId=${id}&pageSize=5`) : null,
  ]);
  const editar = puede(me, "comercial", "editar");
  if (!oportunidad) notFound();

  const abierta = oportunidad.etapa !== "ganada" && oportunidad.etapa !== "perdida";
  const contacto = oportunidad.contactosEmpresa.find((c) => c.id === oportunidad.contactoId);

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/oportunidades", label: "Oportunidades" }}
        title={oportunidad.titulo}
        badges={<EtapaBadge etapa={oportunidad.etapa} />}
        description={
          <>
            <Link href={`/dashboard/empresas/${oportunidad.empresaId}`} className="font-medium text-ink-950 hover:underline">
              {oportunidad.empresaNombre}
            </Link>
            {` · ${SERVICIO_LABELS[oportunidad.servicio] ?? oportunidad.servicio} · Creada el ${formatDate(oportunidad.createdAtUtc)}`}
          </>
        }
        actions={
          <>
            {editar && (
              <Link href={`/dashboard/oportunidades/${oportunidad.id}/editar`} className={BUTTON_SECONDARY}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            )}
            {me?.esAdmin && (
              <EliminarButton
                path={`oportunidades/${oportunidad.id}`}
                confirmText={`¿Eliminar “${oportunidad.titulo}” y su historial? Esta acción no se puede deshacer.`}
                redirectTo="/dashboard/oportunidades"
                successTitle="Oportunidad eliminada"
              />
            )}
          </>
        }
      />

      <div className="mt-6">
        <SoloLectura activo={!editar}>
          <EtapaStepper oportunidadId={oportunidad.id} etapa={oportunidad.etapa} titulo={oportunidad.titulo} />
        </SoloLectura>
        {!abierta && (
          <p className="mt-3 text-sm text-ink-500">
            {oportunidad.cerradaAtUtc && `${oportunidad.etapa === "ganada" ? "Ganada" : "Perdida"} el ${formatDate(oportunidad.cerradaAtUtc)}`}
            {oportunidad.etapa === "perdida" && oportunidad.motivoPerdida && (
              <>
                {oportunidad.cerradaAtUtc && " · "}
                <span className="font-semibold text-ink-950">Motivo:</span> {oportunidad.motivoPerdida}
              </>
            )}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Side column first in the DOM, so on a phone the next step comes before the history. */}
        <div className="flex flex-col gap-6 lg:col-start-2 lg:row-start-1">
          {abierta && (
            <SoloLectura activo={!editar}>
              <ProximaAccionCard
                oportunidadId={oportunidad.id}
                accion={oportunidad.proximaAccion}
                fecha={oportunidad.proximaAccionFecha}
                today={todayInLima()}
              />
            </SoloLectura>
          )}

          {puede(me, "proyectos") && <OportunidadProyecto proyectos={proyectos?.items ?? []} />}

          {puede(me, "diagnosticos") && (
            <OportunidadDiagnosticos oportunidadId={oportunidad.id} diagnosticos={diagnosticos?.items ?? null} puedeCrear={puede(me, "diagnosticos", "editar")} />
          )}

          {puede(me, "propuestas") && (
            <OportunidadPropuestas
              oportunidadId={oportunidad.id}
              propuestas={propuestas?.items ?? null}
              today={todayInLima()}
              puedeCrear={puede(me, "propuestas", "editar")}
            />
          )}

          <section className={`${CARD} p-5`}>
            <h2 className="text-sm font-semibold text-ink-950">Detalles</h2>
            <dl className="mt-3 divide-y divide-line border-t border-line text-sm">
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-500">Valor estimado</dt>
                <dd className="font-semibold text-ink-950">{formatSoles(oportunidad.valorEstimado)}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-500">Cierre estimado</dt>
                <dd className="text-ink-950">
                  {oportunidad.fechaCierreEstimada ? formatDay(oportunidad.fechaCierreEstimada) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-500">Responsable</dt>
                <dd className="text-right text-ink-950">{oportunidad.responsableNombre ?? "Sin asignar"}</dd>
              </div>
              <div className="py-2.5">
                <dt className="text-ink-500">Contacto</dt>
                <dd className="mt-1 text-ink-950">
                  {contacto ? (
                    <>
                      <p className="font-medium">{fullName(contacto)}</p>
                      {contacto.cargo && <p className="text-xs text-ink-500">{contacto.cargo}</p>}
                      {contacto.email && (
                        <a href={`mailto:${contacto.email}`} className="block text-xs text-brand-700 hover:underline">
                          {contacto.email}
                        </a>
                      )}
                      {contacto.telefono && <p className="text-xs text-ink-500">{contacto.telefono}</p>}
                    </>
                  ) : (
                    <span className="text-ink-400">Sin contacto</span>
                  )}
                </dd>
              </div>
              {oportunidad.solicitudId && (
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-ink-500">Origen</dt>
                  <dd>
                    <Link href={`/dashboard/solicitudes/${oportunidad.solicitudId}`} className="text-brand-700 hover:underline">
                      Solicitud web
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <ActividadTimeline
            endpoint={`oportunidades/${oportunidad.id}/actividades`}
            actividades={oportunidad.actividades.map((a) => ({ ...a, createdAtLabel: formatDateTime(a.createdAtUtc) }))}
            soloLectura={!editar}
          />
        </div>
      </div>
    </div>
  );
}
