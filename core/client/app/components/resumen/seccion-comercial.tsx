import Link from "next/link";
import { EmbudoChart } from "@/components/charts/embudo-chart";
import { ServiciosChart } from "@/components/charts/servicios-chart";
import { VentasMensualesChart } from "@/components/charts/ventas-mensuales-chart";
import { ProximaAccionLabel } from "@/components/comercial/proxima-accion-label";
import { ClientStatusBadge } from "@/components/ui/client-status-badge";
import { ActionLink } from "@/components/ui/action-link";
import { CARD } from "@/components/ui/panel-styles";
import { solesCompacto } from "@/lib/chart-theme";
import { formatSoles } from "@/lib/comercial";
import { formatDate } from "@/lib/format-date";

export type DashboardSummary = {
  clientsTotal: number;
  clientsNew: number;
  recentClients: { id: number; fullName: string; status: string; createdAtUtc: string }[];
  empresasTotal: number;
  empresasClientes: number;
  oportunidadesAbiertas: number;
  valorEmbudo: number;
  accionesVencidas: number;
  embudo: { etapa: string; cantidad: number; valor: number }[];
  proximasAcciones: {
    oportunidadId: number;
    titulo: string;
    empresaNombre: string;
    proximaAccion: string;
    proximaAccionFecha: string;
    responsableNombre: string | null;
  }[];
  mensual: { mes: string; creadas: number; ganadas: number; perdidas: number; valorGanado: number }[];
  tasaCierre: number | null;
  porServicio: { servicio: string; cantidad: number; valor: number }[];
};

const count = new Intl.NumberFormat("es-PE");

// The commercial pipeline on the summary: headline figures, monthly sales,
// the funnel, upcoming follow-ups and recent web requests.
export function SeccionComercial({ data, today }: { data: DashboardSummary; today: string }) {
  const ganadas = data.mensual.reduce((sum, m) => sum + m.ganadas, 0);
  const cerradas = ganadas + data.mensual.reduce((sum, m) => sum + m.perdidas, 0);
  const ganadoSeisMeses = data.mensual.reduce((sum, m) => sum + m.valorGanado, 0);

  return (
    <>
      {/* The 1px gaps over a line-colored background draw the dividers, on two rows or one. */}
      <dl className={`${CARD} mt-4 grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-4`}>
        <div className="bg-white p-5 sm:p-6">
          <dt className="text-sm text-ink-500">Oportunidades abiertas</dt>
          <dd className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            {data.oportunidadesAbiertas}
          </dd>
        </div>
        <div className="bg-white p-5 sm:p-6">
          <dt className="text-sm text-ink-500">Valor del embudo</dt>
          <dd className="mt-2 font-display text-3xl font-semibold tracking-tight whitespace-nowrap text-ink-950 sm:text-4xl">
            {/* The full amount doesn't fit half a phone's width. */}
            <span className="sm:hidden">{solesCompacto(data.valorEmbudo)}</span>
            <span className="max-sm:hidden">{formatSoles(data.valorEmbudo)}</span>
          </dd>
        </div>
        <div className="bg-white p-5 sm:p-6">
          <dt className="text-sm text-ink-500">Tasa de cierre</dt>
          <dd className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            {data.tasaCierre === null ? "—" : `${Math.round(data.tasaCierre * 100)}%`}
          </dd>
          <dd className="mt-1 text-xs text-ink-400">
            {ganadas} {ganadas === 1 ? "ganada" : "ganadas"} de {cerradas} cerradas en 6 meses
          </dd>
        </div>
        <div className="bg-white p-5 sm:p-6">
          <dt className="text-sm text-ink-500">Acciones vencidas</dt>
          <dd
            className={`mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl ${
              data.accionesVencidas > 0 ? "text-red-600" : "text-ink-950"
            }`}
          >
            {data.accionesVencidas}
          </dd>
          <dd className="mt-1 text-xs text-ink-400">Seguimientos que ya pasaron de fecha</dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* The grid stretches each card to its row's height: the charts grow
            into it (flex-1) instead of leaving a blank strip below. */}
        <section className={`${CARD} flex min-w-0 flex-col p-6 xl:col-span-2`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-base font-semibold text-ink-950">Ventas ganadas por mes</h2>
            <p className="text-sm text-ink-500">
              <span className="font-semibold text-ink-950">{formatSoles(ganadoSeisMeses)}</span> en los últimos 6 meses
            </p>
          </div>
          <div className="relative mt-5 min-h-60 flex-1">
            <VentasMensualesChart meses={data.mensual} />
          </div>
        </section>

        <section className={`${CARD} min-w-0 p-6`}>
          <h2 className="text-base font-semibold text-ink-950">Embudo por servicio</h2>
          <div className="mt-5">
            <ServiciosChart servicios={data.porServicio} />
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className={`${CARD} flex min-w-0 flex-col p-6`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-ink-950">Embudo por etapa</h2>
            <ActionLink href="/dashboard/oportunidades">Ver tablero</ActionLink>
          </div>
          <div className="relative mt-4 min-h-56 flex-1">
            <EmbudoChart etapas={data.embudo} />
          </div>
          <p className="mt-4 border-t border-line pt-4 text-xs text-ink-500">
            {count.format(data.empresasTotal)} empresas registradas ·{" "}
            {count.format(data.empresasClientes)} {data.empresasClientes === 1 ? "es cliente" : "son clientes"}
          </p>
        </section>

        <section className={`${CARD} min-w-0 p-6`}>
          <h2 className="text-base font-semibold text-ink-950">Próximas acciones</h2>
          {data.proximasAcciones.length === 0 ? (
            <p className="mt-3 border-t border-line pt-4 text-sm text-ink-500">
              No hay seguimientos programados en oportunidades abiertas.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {data.proximasAcciones.map((item) => (
                <li key={item.oportunidadId}>
                  <Link href={`/dashboard/oportunidades/${item.oportunidadId}`} className="group block py-3">
                    <p className="truncate text-sm font-medium text-ink-950 group-hover:underline">
                      {item.titulo}
                      <span className="font-normal text-ink-500"> · {item.empresaNombre}</span>
                    </p>
                    <div className="mt-1">
                      <ProximaAccionLabel accion={item.proximaAccion} fecha={item.proximaAccionFecha} today={today} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={`${CARD} mt-6 p-6`}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-ink-950">
            Solicitudes web recientes
            {data.clientsNew > 0 && (
              <span className="rounded-full bg-brand-700 px-2 py-0.5 text-xs font-medium text-white">
                {data.clientsNew} sin atender
              </span>
            )}
          </h2>
          <ActionLink href="/dashboard/solicitudes">Ver todas</ActionLink>
        </div>

        {data.recentClients.length === 0 ? (
          <p className="mt-3 border-t border-line pt-4 text-sm text-ink-500">Aún no llegan solicitudes.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-t border-line text-sm">
            {data.recentClients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/dashboard/solicitudes/${client.id}`}
                  className="group flex items-center justify-between gap-4 py-3.5"
                >
                  <span className="truncate font-medium text-ink-950 group-hover:underline">{client.fullName}</span>
                  <span className="flex shrink-0 items-center gap-4">
                    <ClientStatusBadge status={client.status} />
                    <span className="w-20 text-right text-xs text-ink-400">{formatDate(client.createdAtUtc)}</span>
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
