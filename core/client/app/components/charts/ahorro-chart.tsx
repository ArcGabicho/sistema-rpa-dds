"use client";

import { Bar, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { AXIS_TICK, CHART, mesCorto, solesCompacto } from "@/lib/chart-theme";
import { formatSoles } from "@/lib/comercial";

export type AhorroMes = { mes: string; real: number; estimado: number };

// Real saving per month (bars) against what the diagnosis estimated for
// the same months (dashed line). Fills its (positioned) parent.
export function AhorroChart({ meses }: { meses: AhorroMes[] }) {
  const data = meses.map((m) => ({ ...m, mes: m.mes.slice(0, 7) }));
  const resumen = data.map((m) => `${mesCorto(m.mes, true)}: real ${formatSoles(m.real)}, estimado ${formatSoles(m.estimado)}`).join("; ");

  return (
    <div role="img" aria-label={`Ahorro real frente al estimado por mes. ${resumen}.`} className="absolute inset-0">
      <ComposedChart responsive data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} style={{ width: "100%", height: "100%" }}>
        <CartesianGrid vertical={false} stroke={CHART.line} />
        <XAxis dataKey="mes" tickFormatter={(mes: string) => mesCorto(mes)} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={solesCompacto} tick={AXIS_TICK} axisLine={false} tickLine={false} width={64} />
        <Tooltip
          cursor={{ fill: CHART.brand200, opacity: 0.4 }}
          content={({ active, payload }) => {
            const m = payload?.[0]?.payload as AhorroMes | undefined;
            if (!active || !m) return null;
            return (
              <ChartTooltipCard
                title={mesCorto(m.mes, true)}
                rows={[
                  { label: "Real", value: formatSoles(m.real), color: CHART.brand700 },
                  { label: "Estimado", value: formatSoles(m.estimado), color: CHART.brand500 },
                  { label: "Cumplimiento", value: m.estimado > 0 ? `${Math.round((m.real / m.estimado) * 100)}%` : "—" },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="real" name="Real" fill={CHART.brand700} radius={[4, 4, 0, 0]} maxBarSize={44} />
        <Line
          dataKey="estimado"
          name="Estimado"
          type="monotone"
          stroke={CHART.brand500}
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={{ r: 4, fill: CHART.brand500, stroke: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: CHART.brand500, stroke: "#fff", strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </div>
  );
}

// The chart's legend, above it: identity never rests on color alone.
export function AhorroLeyenda() {
  return (
    <ul className="flex flex-wrap items-center gap-4 text-xs text-ink-500">
      <li className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART.brand700 }} />
        Ahorro real
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="18" height="6" aria-hidden="true">
          <line x1="0" y1="3" x2="18" y2="3" stroke={CHART.brand500} strokeWidth="2" strokeDasharray="5 3" />
        </svg>
        Estimado en el diagnóstico
      </li>
    </ul>
  );
}
