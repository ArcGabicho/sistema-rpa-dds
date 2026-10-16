"use client";

import { CartesianGrid, ReferenceLine, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { ChartTooltipCard } from "@/components/charts/chart-tooltip";
import { AXIS_TICK, CHART, CUADRANTE_COLORES, solesCompacto } from "@/lib/chart-theme";
import { formatSoles } from "@/lib/comercial";
import { CUADRANTES, CUADRANTE_LABELS, formatNumero, formatPayback, type Proceso } from "@/lib/diagnostico";
import { FACTIBILIDAD_ALTA } from "@/lib/roi";

// The prioritization matrix: how automatable each process is (x) against
// what it would save a year (y), bubble size by hours freed. Colors are the
// quadrants, which also weigh how fast it pays back.
export function MatrizChart({ procesos, alto = 300 }: { procesos: Proceso[]; alto?: number }) {
  const puntos = procesos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    x: p.calculo.factibilidad,
    y: p.calculo.ahorroAnual,
    z: Math.max(p.calculo.horasLiberadasMes, 1),
    horas: p.calculo.horasLiberadasMes,
    payback: p.calculo.paybackMeses,
    cuadrante: p.calculo.cuadrante,
  }));
  const resumen = puntos.map((p) => `${p.nombre}: ${CUADRANTE_LABELS[p.cuadrante]}`).join(", ");

  return (
    <div>
      <div role="img" aria-label={`Matriz de priorización. ${resumen}.`}>
        <ScatterChart responsive margin={{ top: 12, right: 12, bottom: 4, left: 0 }} style={{ width: "100%", height: alto }}>
          <CartesianGrid stroke={CHART.line} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            label={{ value: "Factibilidad", position: "insideBottom", offset: -2, fill: CHART.ink500, fontSize: 12 }}
            height={40}
          />
          <YAxis type="number" dataKey="y" tickFormatter={solesCompacto} tick={AXIS_TICK} axisLine={false} tickLine={false} width={64} />
          <ZAxis type="number" dataKey="z" range={[60, 900]} />
          <ReferenceLine x={FACTIBILIDAD_ALTA} stroke={CHART.ink400} strokeDasharray="4 4" />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof puntos)[number] | undefined;
              if (!active || !p) return null;
              return (
                <ChartTooltipCard
                  title={p.nombre}
                  rows={[
                    { label: CUADRANTE_LABELS[p.cuadrante] ?? p.cuadrante, value: "", color: CUADRANTE_COLORES[p.cuadrante] },
                    { label: "Ahorro anual", value: formatSoles(p.y) },
                    { label: "Horas al mes", value: formatNumero(p.horas) },
                    { label: "Factibilidad", value: `${p.x}/100` },
                    { label: "Recuperación", value: formatPayback(p.payback) },
                  ]}
                />
              );
            }}
          />
          {CUADRANTES.map((c) => (
            <Scatter
              key={c.value}
              name={c.label}
              data={puntos.filter((p) => p.cuadrante === c.value)}
              fill={CUADRANTE_COLORES[c.value]}
              fillOpacity={0.85}
              isAnimationActive={false}
            />
          ))}
        </ScatterChart>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-500">
        {CUADRANTES.map((c) => (
          <li key={c.value} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CUADRANTE_COLORES[c.value] }} />
            {c.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="h-px w-4 border-t border-dashed border-ink-400" />
          Factibilidad alta (≥ {FACTIBILIDAD_ALTA})
        </li>
      </ul>
    </div>
  );
}
