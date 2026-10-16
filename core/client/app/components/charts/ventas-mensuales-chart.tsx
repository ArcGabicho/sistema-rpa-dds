"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { AXIS_TICK, CHART, mesCorto, solesCompacto } from "@/lib/chart-theme";
import { formatSoles } from "@/lib/comercial";

export type MesResumen = { mes: string; creadas: number; ganadas: number; perdidas: number; valorGanado: number };

// Won value per month, last six months; the tooltip adds how many deals
// were opened, won and lost that month. Fills its (positioned) parent.
export function VentasMensualesChart({ meses }: { meses: MesResumen[] }) {
  const resumen = meses.map((m) => `${mesCorto(m.mes, true)}: ${formatSoles(m.valorGanado)}`).join(", ");

  return (
    <div role="img" aria-label={`Ventas ganadas por mes. ${resumen}.`} className="absolute inset-0">
      <BarChart responsive data={meses} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} style={{ width: "100%", height: "100%" }}>
        <CartesianGrid vertical={false} stroke={CHART.line} />
        <XAxis dataKey="mes" tickFormatter={(mes: string) => mesCorto(mes)} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={solesCompacto} tick={AXIS_TICK} axisLine={false} tickLine={false} width={64} />
        <Tooltip
          cursor={{ fill: CHART.brand200, opacity: 0.4 }}
          content={({ active, payload }) => {
            const m = payload?.[0]?.payload as MesResumen | undefined;
            if (!active || !m) return null;
            return (
              <ChartTooltipCard
                title={mesCorto(m.mes, true)}
                rows={[
                  { label: "Ganado", value: formatSoles(m.valorGanado), color: CHART.brand700 },
                  { label: "Ganadas", value: m.ganadas },
                  { label: "Perdidas", value: m.perdidas },
                  { label: "Nuevas", value: m.creadas },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="valorGanado" name="Ganado" fill={CHART.brand700} radius={[4, 4, 0, 0]} maxBarSize={44} />
      </BarChart>
    </div>
  );
}
