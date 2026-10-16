import { CARD } from "@/components/ui/panel-styles";
import { formatPayback, formatPorcentaje } from "@/lib/diagnostico";
import { formatMoneda, type Propuesta } from "@/lib/propuesta";

// A sent (frozen) proposal, read-only: scope and prices, schedule, totals.
export function PropuestaResumen({ propuesta: p }: { propuesta: Propuesta }) {
  const m = (v: number) => formatMoneda(v, p.moneda, 2);
  const grupos = [
    { tipo: "implementacion", titulo: "Implementación (pago único)" },
    { tipo: "mensual", titulo: "Servicio mensual" },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className={`${CARD} overflow-hidden`}>
          <h2 className="p-5 text-base font-semibold text-ink-950">Alcance e inversión</h2>
          {grupos.map((g) => {
            const items = p.items.filter((i) => i.tipo === g.tipo);
            if (items.length === 0) return null;
            return (
              <div key={g.tipo} className="border-t border-line">
                <p className="bg-brand-50 px-5 py-2 text-xs font-semibold text-ink-500">{g.titulo}</p>
                <ul className="divide-y divide-line">
                  {items.map((i, n) => (
                    <li key={n} className="flex items-start justify-between gap-4 px-5 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-ink-950">
                          {i.descripcion}
                          {i.cantidad !== 1 && <span className="font-normal text-ink-500"> × {i.cantidad}</span>}
                        </p>
                        {i.detalle && <p className="mt-0.5 text-xs text-ink-500">{i.detalle}</p>}
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums text-ink-950">{m(i.cantidad * i.precioUnitario)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        <section className={`${CARD} p-5`}>
          <h2 className="text-base font-semibold text-ink-950">
            Cronograma <span className="font-normal text-ink-500">{p.totales.semanas} semanas</span>
          </h2>
          <ol className="mt-3 divide-y divide-line border-t border-line text-sm">
            {p.fases.map((f, n) => (
              <li key={n} className="flex items-start justify-between gap-4 py-2.5">
                <div>
                  <p className="font-medium text-ink-950">{f.nombre}</p>
                  {f.descripcion && <p className="text-xs text-ink-500">{f.descripcion}</p>}
                </div>
                <span className="shrink-0 text-ink-700">
                  {f.semanas} {f.semanas === 1 ? "semana" : "semanas"}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className={`${CARD} h-fit p-5 text-sm`}>
        <h2 className="mb-3 text-base font-semibold text-ink-950">Totales</h2>
        <dl className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-500">Implementación</dt>
            <dd className="tabular-nums">{m(p.totales.subtotalImplementacion)}</dd>
          </div>
          {p.totales.descuento > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Descuento ({p.descuentoPorcentaje} %)</dt>
              <dd className="tabular-nums">−{m(p.totales.descuento)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-ink-500">IGV (18 %)</dt>
            <dd className="tabular-nums">{m(p.totales.igvImplementacion)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-line pt-1.5 font-semibold text-ink-950">
            <dt>Total implementación</dt>
            <dd className="tabular-nums">{m(p.totales.totalImplementacion)}</dd>
          </div>
          {p.totales.baseMensual > 0 && (
            <div className="mt-2 flex justify-between gap-3 font-semibold text-ink-950">
              <dt>Total mensual</dt>
              <dd className="tabular-nums">{m(p.totales.totalMensual)}</dd>
            </div>
          )}
        </dl>
        <dl className="mt-4 flex flex-col gap-1.5 rounded-md bg-brand-50 p-3">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-500">Primer año (sin IGV)</dt>
            <dd className="font-semibold tabular-nums text-ink-950">{formatMoneda(p.totales.valorPrimerAnio, p.moneda)}</dd>
          </div>
          {p.ahorroAnualEstimado !== null && (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Ahorro anual esperado</dt>
                <dd className="tabular-nums text-ink-950">{formatMoneda(p.ahorroAnualEstimado, p.moneda)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Recuperación</dt>
                <dd className="text-ink-950">{formatPayback(p.totales.paybackMeses)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">ROI a 12 meses</dt>
                <dd className="tabular-nums text-ink-950">{formatPorcentaje(p.totales.roi12Meses)}</dd>
              </div>
            </>
          )}
        </dl>
      </aside>
    </div>
  );
}
