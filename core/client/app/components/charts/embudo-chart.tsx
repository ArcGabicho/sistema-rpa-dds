"use client";

import { Bar, BarChart, LabelList, Rectangle, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { AXIS_TICK, CHART } from "@/lib/chart-theme";
import { ETAPA_LABELS, formatSoles } from "@/lib/comercial";

export type EtapaResumen = { etapa: string; cantidad: number; valor: number };

// Deals per open stage, darker as they get closer to signing. Fills its
// (positioned) parent; extra height goes to the gaps, not the bars.
const TONOS = [CHART.brand300, CHART.brand400, CHART.brand500, CHART.brand600, CHART.brand700];

export function EmbudoChart({ etapas }: { etapas: EtapaResumen[] }) {
  const data = etapas.map((e) => ({ ...e, label: ETAPA_LABELS[e.etapa] ?? e.etapa }));
  const resumen = data.map((e) => `${e.label}: ${e.cantidad}`).join(", ");

  return (
    <div role="img" aria-label={`Oportunidades por etapa. ${resumen}.`} className="absolute inset-0">
      <BarChart
        responsive
        layout="vertical"
        data={data}
        margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
        barCategoryGap="22%"
        style={{ width: "100%", height: "100%" }}
      >
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} width={96} />
        <Tooltip
          cursor={{ fill: CHART.brand200, opacity: 0.4 }}
          content={({ active, payload }) => {
            const e = payload?.[0]?.payload as (EtapaResumen & { label: string }) | undefined;
            if (!active || !e) return null;
            return (
              <ChartTooltipCard
                title={e.label}
                rows={[
                  { label: "Oportunidades", value: e.cantidad },
                  { label: "Valor", value: formatSoles(e.valor) },
                ]}
              />
            );
          }}
        />
        <Bar
          dataKey="cantidad"
          radius={[0, 4, 4, 0]}
          maxBarSize={36}
          shape={(props) => <Rectangle {...props} fill={TONOS[props.index] ?? CHART.brand700} />}
        >
          <LabelList dataKey="cantidad" position="right" style={{ fill: CHART.ink950, fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </div>
  );
}
