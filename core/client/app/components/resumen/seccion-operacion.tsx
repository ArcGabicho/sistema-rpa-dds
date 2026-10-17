import Link from "next/link";
import { AhorroChart, AhorroLeyenda } from "@/components/charts/ahorro-chart";
import { KpiStrip } from "@/components/resumen/resumen-ui";
import { PlazoBadge } from "@/components/ui/operacion-badges";
import { CARD } from "@/components/ui/panel-styles";
import { formatSoles } from "@/lib/comercial";
import { formatPorcentaje } from "@/lib/diagnostico";
import { nombreMes, type BotsResumen, type IncidenciasResumen, type VencimientoItem } from "@/lib/operacion";

// Operation on the summary: what the bots saved last month against the
// estimate, the support queue, and what expires within a month.
export function SeccionOperacion({
  bots,
  incidencias,
  vencimientos,
}: {
  bots: BotsResumen | null;
  incidencias: IncidenciasResumen | null;
  vencimientos: VencimientoItem[] | null;
}) {
  const proximos = (vencimientos ?? []).slice(0, 6);
  return (
    <>
      <KpiStrip
        kpis={[
          {
            label: bots ? `Ahorro real · ${nombreMes(bots.mes, false)}` : "Ahorro real",
            valor: bots ? formatSoles(bots.ahorroRealMes) : "—",
            detalle: bots ? `${formatPorcentaje(bots.cumplimientoMes)} de lo estimado` : undefined,
          },
          { label: "Bots activos", valor: bots?.activos ?? "—", detalle: bots && bots.sinRegistro > 0 ? `${bots.sinRegistro} sin su registro del mes` : undefined },
          {
            label: "Incidencias abiertas",
            valor: incidencias?.abiertas ?? "—",
            detalle: incidencias ? `${incidencias.graves} críticas o altas` : undefined,
          },
          {
            label: "Fuera de SLA",
            valor: incidencias?.fueraDeSla ?? "—",
            alerta: (incidencias?.fueraDeSla ?? 0) > 0,
            detalle: incidencias?.cumplimientoSla90 != null ? `${formatPorcentaje(incidencias.cumplimientoSla90)} cumplido en 90 días` : undefined,
          },
        ]}
      />
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className={`${CARD} flex min-w-0 flex-col p-6`}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-base font-semibold text-ink-950">Ahorro real frente al estimado</h3>
            <AhorroLeyenda />
          </div>
          {bots && bots.serie.length > 0 ? (
            <div className="relative mt-4 min-h-56 flex-1">
              <AhorroChart meses={bots.serie} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">Aparecerá con el primer mes registrado de un bot.</p>
          )}
        </section>
        <section className={`${CARD} min-w-0 p-6`}>
          <h3 className="text-base font-semibold text-ink-950">Vence en 30 días</h3>
          {proximos.length === 0 ? (
            <p className="mt-3 border-t border-line pt-4 text-sm text-ink-500">Nada vence en los próximos 30 días.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {proximos.map((v) => (
                <li key={`${v.tipo}-${v.id}`} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink-950">{v.nombre}</span>
                    <span className="block truncate text-xs text-ink-500">{v.empresaNombre ?? "DDS"}</span>
                  </span>
                  <PlazoBadge estado={v.estado} dias={v.dias} fecha={v.venceEl} />
                </li>
              ))}
            </ul>
          )}
          {(vencimientos?.length ?? 0) > proximos.length && (
            <Link href="/dashboard/vencimientos" className="mt-3 inline-block text-xs font-medium text-brand-700 hover:underline">
              Ver los {vencimientos!.length}
            </Link>
          )}
        </section>
      </div>
    </>
  );
}
