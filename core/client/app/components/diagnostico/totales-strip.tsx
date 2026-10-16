import { formatSoles } from "@/lib/comercial";
import { formatNumero, formatPayback, formatPorcentaje, type Totales } from "@/lib/diagnostico";

// The diagnosis's headline figures, added up over all its processes.
export function TotalesStrip({ totales }: { totales: Totales }) {
  const items: { label: string; value: string; detalle?: string }[] = [
    { label: "Horas liberadas al mes", value: formatNumero(totales.horasLiberadasMes), detalle: `${formatNumero(totales.fte, 1)} FTE` },
    { label: "Ahorro anual estimado", value: formatSoles(totales.ahorroAnual) },
    {
      label: "Inversión",
      value: formatSoles(totales.inversion),
      detalle: totales.costoMensual > 0 ? `+ ${formatSoles(totales.costoMensual)} al mes` : undefined,
    },
    { label: "ROI a 12 meses", value: formatPorcentaje(totales.roi12Meses) },
    { label: "Recuperación", value: formatPayback(totales.paybackMeses) },
  ];

  return (
    // Two columns (the fifth figure spanning both) until there's room for five.
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line shadow-card lg:grid-cols-5 print:grid-cols-5 print:shadow-none print:ring-1 print:ring-line [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1 print:[&>*:last-child]:col-span-1">
      {items.map((item) => (
        <div key={item.label} className="bg-white p-4 sm:p-5">
          <dt className="text-xs text-ink-500">{item.label}</dt>
          <dd className="mt-1.5 font-display text-xl font-semibold tracking-tight whitespace-nowrap text-ink-950 sm:text-2xl">
            {item.value}
          </dd>
          {item.detalle && <dd className="mt-0.5 text-xs text-ink-400">{item.detalle}</dd>}
        </div>
      ))}
    </dl>
  );
}
