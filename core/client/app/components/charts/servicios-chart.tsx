"use client";

import { Pie, PieChart, Tooltip } from "recharts";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { CHART, solesCompacto } from "@/lib/chart-theme";
import { SERVICIO_LABELS, formatSoles } from "@/lib/comercial";

export type ServicioResumen = { servicio: string; cantidad: number; valor: number };

const COLORES: Record<string, string> = { rpa: CHART.brand700, ia: CHART.brand500, analitica: CHART.glow400 };

// Share of the open pipeline's value by service line: the donut, and under
// it a legend with the exact figures.
export function ServiciosChart({ servicios }: { servicios: ServicioResumen[] }) {
  const total = servicios.reduce((sum, s) => sum + s.valor, 0);
  const data = servicios.map((s) => ({
    ...s,
    nombre: SERVICIO_LABELS[s.servicio] ?? s.servicio,
    fill: COLORES[s.servicio] ?? CHART.ink400,
  }));
  const porcentaje = (valor: number) => (total > 0 ? `${Math.round((valor / total) * 100)}%` : "0%");

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="relative h-44 w-44 shrink-0"
        role="img"
        aria-label={`Valor del embudo por servicio. ${data.map((s) => `${s.nombre}: ${porcentaje(s.valor)}`).join(", ")}.`}
      >
        {total > 0 ? (
          <PieChart responsive style={{ width: "100%", height: "100%" }}>
            <Pie
              data={data}
              dataKey="valor"
              nameKey="nombre"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                const s = payload?.[0]?.payload as (typeof data)[number] | undefined;
                if (!active || !s) return null;
                return (
                  <ChartTooltipCard
                    title={s.nombre}
                    rows={[
                      { label: "Valor", value: formatSoles(s.valor), color: s.fill },
                      { label: "Oportunidades", value: s.cantidad },
                    ]}
                  />
                );
              }}
            />
          </PieChart>
        ) : (
          <div className="h-full w-full rounded-full border-[14px] border-line" />
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] text-ink-500">En juego</span>
          <span className="font-display text-lg font-semibold text-ink-950" title={formatSoles(total)}>
            {solesCompacto(total)}
          </span>
        </div>
      </div>

      <ul className="flex w-full flex-col divide-y divide-line text-sm">
        {data.map((s) => (
          <li key={s.servicio} className="flex items-start justify-between gap-3 py-2.5">
            <span className="flex min-w-0 items-start gap-2">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.fill }} />
              <span className="min-w-0">
                <span className="block truncate text-ink-700">{s.nombre}</span>
                <span className="block text-xs text-ink-500">
                  {s.cantidad} {s.cantidad === 1 ? "oportunidad" : "oportunidades"} · {formatSoles(s.valor)}
                </span>
              </span>
            </span>
            <span className="shrink-0 font-semibold text-ink-950 tabular-nums">{porcentaje(s.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
