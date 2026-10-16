import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MatrizChart } from "@/components/charts/matriz-chart";
import { ImprimirButton } from "@/components/diagnostico/imprimir-button";
import { TotalesStrip } from "@/components/diagnostico/totales-strip";
import { CuadranteBadge } from "@/components/ui/diagnostico-badges";
import { apiGet } from "@/lib/api";
import { SERVICIO_LABELS, formatSoles } from "@/lib/comercial";
import { CUADRANTES, formatNumero, formatPayback, type Diagnostico, type Proceso } from "@/lib/diagnostico";
import { formatDate } from "@/lib/format-date";
import { HORAS_POR_FTE, FACTIBILIDAD_ALTA, RETORNO_RAPIDO_MESES } from "@/lib/roi";
import { SITE } from "@/lib/site-config";

const ORDEN_CUADRANTE = Object.fromEntries(CUADRANTES.map((c, i) => [c.value, i]));

// Quick wins first, then by saving.
function priorizar(procesos: Proceso[]) {
  return [...procesos].sort(
    (a, b) =>
      (ORDEN_CUADRANTE[a.calculo.cuadrante] ?? 9) - (ORDEN_CUADRANTE[b.calculo.cuadrante] ?? 9) ||
      b.calculo.ahorroAnual - a.calculo.ahorroAnual,
  );
}

function lista(nombres: string[]) {
  if (nombres.length <= 1) return nombres.join("");
  return `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
}

// The deliverable for the client: a print-ready report (A4) built from the
// diagnosis's own figures. Print it or save it as PDF from the browser.
export default async function InformeDiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await apiGet<Diagnostico>(`diagnosticos/${id}`);
  if (!d) notFound();

  const procesos = priorizar(d.procesos);
  const areas = [...new Set(procesos.map((p) => p.area).filter((a): a is string => !!a))];
  const quickWins = procesos.filter((p) => p.calculo.cuadrante === "quick_win");
  const fecha = formatDate(d.entregadoAtUtc ?? new Date().toISOString());
  const conCostoPropio = procesos.filter((p) => p.costoHora !== null);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <Link href={`/dashboard/diagnosticos/${d.id}`} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-950">
          <ArrowLeft className="h-4 w-4" />
          Volver al diagnóstico
        </Link>
        <ImprimirButton />
      </div>

      <article className="rounded-lg bg-white p-8 shadow-card sm:p-12 print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8 print:flex-nowrap">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Diagnóstico de automatización</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950">{d.empresaNombre}</h1>
            <p className="mt-1 text-sm text-ink-500">{d.titulo}</p>
          </div>
          <div className="shrink-0 text-right text-sm text-ink-500">
            <div className="flex items-center justify-end gap-2">
              <Image src="/assets/icon.png" alt="" width={24} height={24} className="h-6 w-6" />
              <span className="font-display font-semibold text-ink-950">{SITE.name}</span>
            </div>
            <p className="mt-2">{fecha}</p>
            {d.responsableNombre && <p>Elaborado por {d.responsableNombre}</p>}
          </div>
        </header>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-ink-950">Resumen</h2>
          {d.resumen && <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-700">{d.resumen}</p>}
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            Se evaluaron {procesos.length} {procesos.length === 1 ? "proceso" : "procesos"}
            {areas.length > 0 && ` de ${lista(areas.map((a) => a.toLowerCase()))}`}. Automatizarlos liberaría unas{" "}
            <strong className="text-ink-950">{formatNumero(d.totales.horasLiberadasMes)} horas al mes</strong> (
            {formatNumero(d.totales.fte, 1)} personas a tiempo completo), con un ahorro estimado de{" "}
            <strong className="text-ink-950">{formatSoles(d.totales.ahorroAnual)} al año</strong>.
            {quickWins.length > 0 &&
              ` Recomendamos empezar por ${lista(quickWins.map((p) => `«${p.nombre}»`))}: ${
                quickWins.length === 1 ? "es factible y se recupera" : "son factibles y se recuperan"
              } en menos de ${RETORNO_RAPIDO_MESES} meses.`}
          </p>
        </section>

        <section className="mt-8 break-inside-avoid">
          <TotalesStrip totales={d.totales} />
        </section>

        {procesos.length > 0 && (
          <section className="mt-10 break-inside-avoid">
            <h2 className="text-lg font-semibold text-ink-950">Matriz de priorización</h2>
            <p className="mt-1 text-sm text-ink-500">
              Cada círculo es un proceso: a la derecha, más fácil de automatizar; arriba, más ahorro; el tamaño, las horas que libera.
            </p>
            <div className="mt-4">
              <MatrizChart procesos={procesos} alto={320} />
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-ink-950">Recomendación por prioridad</h2>
          <div className="mt-4 flex flex-col gap-5">
            {CUADRANTES.map((c) => {
              const grupo = procesos.filter((p) => p.calculo.cuadrante === c.value);
              if (grupo.length === 0) return null;
              return (
                <div key={c.value} className="break-inside-avoid">
                  <div className="flex items-center gap-2">
                    <CuadranteBadge cuadrante={c.value} />
                    <p className="text-sm text-ink-500">{c.detalle}</p>
                  </div>
                  <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
                    {grupo.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                        <span className="font-medium text-ink-950">
                          {p.nombre}
                          <span className="font-normal text-ink-500"> · {SERVICIO_LABELS[p.servicio] ?? p.servicio}</span>
                        </span>
                        <span className="text-ink-700">
                          {formatSoles(p.calculo.ahorroAnual)} al año ·{" "}
                          {p.calculo.paybackMeses === null
                            ? "el ahorro no cubre su costo mensual"
                            : `se recupera en ${formatPayback(p.calculo.paybackMeses).toLowerCase()}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-ink-950">Detalle por proceso</h2>
          <div className="mt-4 overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-xs print:text-[10px]">
              <thead className="border-b border-line text-ink-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Proceso</th>
                  <th className="px-2 py-2 text-right font-medium">Hoy (h/mes)</th>
                  <th className="px-2 py-2 text-right font-medium">Liberadas</th>
                  <th className="px-2 py-2 text-right font-medium">Ahorro anual</th>
                  <th className="px-2 py-2 text-right font-medium">Inversión</th>
                  <th className="px-2 py-2 text-right font-medium">Mensual</th>
                  <th className="px-2 py-2 font-medium">Recuperación</th>
                  <th className="py-2 pl-2 text-right font-medium">Factibilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {procesos.map((p) => (
                  <tr key={p.id} className="break-inside-avoid">
                    <td className="py-2 pr-3">
                      <span className="font-medium text-ink-950">{p.nombre}</span>
                      {p.area && <span className="block text-ink-500">{p.area}</span>}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{formatNumero(p.calculo.horasMes, 1)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{formatNumero(p.calculo.horasLiberadasMes, 1)}</td>
                    <td className="px-2 py-2 text-right font-semibold whitespace-nowrap tabular-nums text-ink-950">{formatSoles(p.calculo.ahorroAnual)}</td>
                    <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">{formatSoles(p.costoImplementacion)}</td>
                    <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">{formatSoles(p.costoMensual)}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{formatPayback(p.calculo.paybackMeses)}</td>
                    <td className="py-2 pl-2 text-right tabular-nums">{p.calculo.factibilidad}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-ink-500 break-inside-avoid">
          <h2 className="text-sm font-semibold text-ink-950">Supuestos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>
              Las cifras son estimaciones a partir de los volúmenes y tiempos que reportó {d.empresaNombre}; se validan al preparar la
              propuesta.
            </li>
            <li>
              Costo por hora del personal: S/ {formatNumero(d.costoHora, 2)}
              {conCostoPropio.length > 0 && ` (con un costo propio en ${lista(conCostoPropio.map((p) => `«${p.nombre}»`))})`}. Una persona a
              tiempo completo equivale a {HORAS_POR_FTE} horas al mes.
            </li>
            <li>
              La factibilidad promedia cinco criterios (reglas claras, datos digitales, sistemas estables, proceso estándar y pocas
              excepciones) en una escala de 0 a 100; desde {FACTIBILIDAD_ALTA} se considera alta.
            </li>
            <li>
              Un proceso es quick win si su factibilidad es alta y la inversión se recupera en {RETORNO_RAPIDO_MESES} meses o menos con el
              ahorro neto de su costo mensual.
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}
