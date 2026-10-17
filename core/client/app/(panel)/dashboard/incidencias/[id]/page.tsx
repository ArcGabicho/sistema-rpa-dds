import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { EliminarButton } from "@/components/comercial/eliminar-button";
import { IncidenciaAcciones } from "@/components/operacion/incidencia-acciones";
import { IncidenciaDetalles } from "@/components/operacion/incidencia-detalles";
import { SeguimientoPanel } from "@/components/operacion/seguimiento-panel";
import { IncidenciaEstadoBadge, SeveridadBadge, SlaBadge } from "@/components/ui/operacion-badges";
import { PageHeader } from "@/components/ui/page-header";
import { CARD } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import type { Paged, TeamUser } from "@/lib/comercial";
import { formatDateTime, instanteUtc } from "@/lib/format-date";
import { CANAL_LABELS, CAUSA_LABELS, SEVERIDAD_LABELS, duracion, relojServidor, type BotItem, type Incidencia } from "@/lib/operacion";
import { getSessionUser, isAdmin } from "@/lib/session";

export default async function IncidenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [incidencia, users, user] = await Promise.all([apiGet<Incidencia>(`incidencias/${id}`), apiGet<TeamUser[]>("users"), getSessionUser()]);
  if (!incidencia) notFound();
  const bots = await apiGet<Paged<BotItem>>(`bots?empresaId=${incidencia.empresaId}&pageSize=100`);

  const ahora = relojServidor();
  const sla = incidencia.sla;
  const resuelta = incidencia.estado === "resuelta";

  // Response: met when it was taken in time; pending while open and untaken.
  const respuesta = incidencia.primeraRespuestaAtUtc
    ? {
        texto: `Tomada el ${formatDateTime(incidencia.primeraRespuestaAtUtc)}`,
        detalle: `en ${duracion((instanteUtc(incidencia.primeraRespuestaAtUtc) - instanteUtc(incidencia.createdAtUtc)) / 3_600_000)}`,
        ok: sla.respuestaCumplida,
      }
    : {
        texto: sla.respuestaCumplida === false ? "Sin tomar: venció el plazo" : `Tomar antes del ${formatDateTime(sla.venceRespuestaUtc)}`,
        detalle: null,
        ok: sla.respuestaCumplida,
      };
  const resolucion = resuelta && incidencia.resueltaAtUtc
    ? {
        texto: `Resuelta el ${formatDateTime(incidencia.resueltaAtUtc)}`,
        detalle: `en ${duracion((instanteUtc(incidencia.resueltaAtUtc) - instanteUtc(incidencia.createdAtUtc)) / 3_600_000 - incidencia.minutosEnPausa / 60)} de trabajo`,
        ok: sla.resolucionCumplida,
      }
    : { texto: `Resolver antes del ${formatDateTime(sla.venceResolucionUtc)}`, detalle: null, ok: sla.resolucionCumplida };

  const seguimiento = incidencia.seguimiento.map((s) => ({ ...s, createdAtLabel: formatDateTime(s.createdAtUtc) }));

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/incidencias", label: "Incidencias" }}
        title={incidencia.titulo}
        badges={
          <>
            <SeveridadBadge severidad={incidencia.severidad} />
            <IncidenciaEstadoBadge estado={incidencia.estado} />
          </>
        }
        description={
          <>
            <span className="font-mono">{incidencia.codigo}</span>
            {" · "}
            <Link href={`/dashboard/empresas/${incidencia.empresaId}`} className="font-medium text-ink-950 hover:underline">
              {incidencia.empresaNombre}
            </Link>
            {incidencia.botId && (
              <>
                {" · "}
                <Link href={`/dashboard/bots/${incidencia.botId}`} className="hover:text-ink-950 hover:underline">
                  {incidencia.botNombre}
                </Link>
              </>
            )}
            {" · "}
            {CANAL_LABELS[incidencia.canal] ?? incidencia.canal}, {formatDateTime(incidencia.createdAtUtc)}
            {incidencia.reportadoPor && ` · ${incidencia.reportadoPor}`}
          </>
        }
        actions={
          <>
            <IncidenciaAcciones id={incidencia.id} estado={incidencia.estado} causa={incidencia.causa} />
            {isAdmin(user) && (
              <EliminarButton
                path={`incidencias/${incidencia.id}`}
                confirmText={`¿Eliminar la incidencia ${incidencia.codigo} con su seguimiento? Esta acción no se puede deshacer.`}
                redirectTo="/dashboard/incidencias"
                successTitle="Incidencia eliminada"
              />
            )}
          </>
        }
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {resuelta && incidencia.solucion && (
            <section className={`${CARD} border-l-4 border-brand-700 p-6`}>
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink-950">
                <CheckCircle2 className="h-4 w-4 text-brand-700" />
                Solución
              </h2>
              {incidencia.causa && <p className="mt-1 text-xs text-ink-500 first-letter:uppercase">Causa: {CAUSA_LABELS[incidencia.causa]?.toLowerCase()}</p>}
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-700">{incidencia.solucion}</p>
            </section>
          )}
          {incidencia.descripcion && (
            <section className={`${CARD} p-6`}>
              <h2 className="text-base font-semibold text-ink-950">Qué pasa</h2>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-700">{incidencia.descripcion}</p>
            </section>
          )}
          <SeguimientoPanel incidenciaId={incidencia.id} items={seguimiento} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section className={`${CARD} p-5`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-ink-950">SLA</h2>
              <SlaBadge sla={sla} ahora={ahora} />
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Severidad {SEVERIDAD_LABELS[incidencia.severidad]?.toLowerCase()}: respuesta en {duracion(sla.objetivoRespuestaHoras)} y resolución en{" "}
              {duracion(sla.objetivoResolucionHoras)}, en horas corridas.
            </p>
            <dl className="mt-3 divide-y divide-line border-t border-line text-sm">
              {[
                { label: "Respuesta", ...respuesta },
                { label: "Resolución", ...resolucion },
              ].map((fila) => (
                <div key={fila.label} className="py-2.5">
                  <dt className="flex items-center justify-between gap-3 text-ink-500">
                    {fila.label}
                    {fila.ok !== null && (
                      <span className={`text-xs font-medium ${fila.ok ? "text-brand-700" : "text-red-600"}`}>{fila.ok ? "A tiempo" : "Fuera de plazo"}</span>
                    )}
                  </dt>
                  <dd className="mt-0.5 text-ink-950">
                    {fila.texto}
                    {fila.detalle && <span className="text-ink-500"> · {fila.detalle}</span>}
                  </dd>
                </div>
              ))}
              {incidencia.minutosEnPausa > 0 && (
                <div className="py-2.5">
                  <dt className="text-ink-500">Esperando al cliente</dt>
                  <dd className="mt-0.5 text-ink-950">
                    {duracion(incidencia.minutosEnPausa / 60)}
                    {incidencia.pausadaDesdeUtc ? " hasta ahora" : ""}
                    <span className="text-ink-500"> · no cuenta para el SLA</span>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <IncidenciaDetalles
            incidencia={incidencia}
            bots={(bots?.items ?? []).filter((b) => b.estado !== "retirado" || b.id === incidencia.botId).map((b) => ({ id: b.id, nombre: b.nombre }))}
            users={users ?? []}
          />
        </div>
      </div>
    </div>
  );
}
