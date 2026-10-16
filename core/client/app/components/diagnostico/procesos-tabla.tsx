"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { sileo } from "sileo";
import { ProcesoEditor } from "@/components/diagnostico/proceso-editor";
import { CuadranteBadge } from "@/components/ui/diagnostico-badges";
import { BUTTON_PRIMARY, CARD } from "@/components/ui/panel-styles";
import { SERVICIO_CORTO, formatSoles } from "@/lib/comercial";
import { formatNumero, formatPayback, type Proceso } from "@/lib/diagnostico";
import { panelFetch } from "@/lib/panel-api";

// The diagnosis's processes with their figures; add, edit or remove them
// (the editor opens in a dialog with a live estimate).
export function ProcesosTabla({
  diagnosticoId,
  costoHora,
  procesos,
}: {
  diagnosticoId: number;
  costoHora: number;
  procesos: Proceso[];
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<Proceso | "nuevo" | null>(null);
  const [borrando, setBorrando] = useState<number | null>(null);

  async function eliminar(p: Proceso) {
    if (!window.confirm(`¿Quitar “${p.nombre}” del diagnóstico?`)) return;
    setBorrando(p.id);
    const result = await panelFetch(`procesos/${p.id}`, { method: "DELETE" });
    setBorrando(null);
    if (!result.ok) {
      sileo.error({
        title: "No se pudo quitar el proceso",
        description: result.message,
      });
      return;
    }
    router.refresh();
  }

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <h2 className="text-base font-semibold text-ink-950">
          Procesos evaluados <span className="font-normal text-ink-500">{procesos.length}</span>
        </h2>
        <button type="button" onClick={() => setEditando("nuevo")} className={`${BUTTON_PRIMARY} h-9 px-3`}>
          <Plus className="h-4 w-4" />
          Agregar proceso
        </button>
      </div>

      {procesos.length === 0 ? (
        <p className="border-t border-line px-5 py-6 text-sm text-ink-500">
          Aún no hay procesos. Agrega los que levantaste con el cliente: cuántas veces se hacen, cuánto toman y qué tan
          automatizables son.
        </p>
      ) : (
        <>
          {/* Phone: one row per process; tap to edit. */}
          <ul className="divide-y divide-line border-t border-line md:hidden">
            {procesos.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setEditando(p)}
                  className="flex w-full flex-col gap-1 p-4 text-left active:bg-brand-50"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-medium text-ink-950">{p.nombre}</span>
                    <CuadranteBadge cuadrante={p.calculo.cuadrante} />
                  </span>
                  <span className="text-xs text-ink-500">
                    {[p.area, SERVICIO_CORTO[p.servicio]].filter(Boolean).join(" · ")}
                  </span>
                  <span className="text-xs text-ink-700">
                    <span className="font-semibold text-ink-950">{formatSoles(p.calculo.ahorroAnual)}</span> al año ·{" "}
                    {formatPayback(p.calculo.paybackMeses).toLowerCase()} · factibilidad {p.calculo.factibilidad}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto border-t border-line md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-brand-50 text-xs text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Proceso</th>
                  <th className="px-3 py-3 text-right font-medium">Horas/mes liberadas</th>
                  <th className="px-3 py-3 text-right font-medium">Ahorro anual</th>
                  <th className="px-3 py-3 text-right font-medium">Inversión</th>
                  <th className="px-3 py-3 font-medium">Recuperación</th>
                  <th className="px-3 py-3 font-medium">Factibilidad</th>
                  <th className="px-3 py-3 font-medium">Prioridad</th>
                  <th className="px-3 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {procesos.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-brand-50">
                    <td className="max-w-xs px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setEditando(p)}
                        className="text-left font-medium text-ink-950 hover:underline"
                      >
                        {p.nombre}
                      </button>
                      <p className="text-xs text-ink-500">
                        {[p.area, SERVICIO_CORTO[p.servicio]].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink-950">
                      {formatNumero(p.calculo.horasLiberadasMes, 1)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums text-ink-950">
                      {formatSoles(p.calculo.ahorroAnual)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums text-ink-500">
                      {formatSoles(p.costoImplementacion)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-ink-700">
                      {formatPayback(p.calculo.paybackMeses)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-brand-100">
                          <div
                            className="h-full rounded-full bg-brand-700"
                            style={{ width: `${p.calculo.factibilidad}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-ink-700">{p.calculo.factibilidad}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <CuadranteBadge cuadrante={p.calculo.cuadrante} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditando(p)}
                          aria-label={`Editar ${p.nombre}`}
                          className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-white hover:text-ink-950"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={borrando === p.id}
                          onClick={() => eliminar(p)}
                          aria-label={`Quitar ${p.nombre}`}
                          className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ProcesoEditor
        diagnosticoId={diagnosticoId}
        costoHora={costoHora}
        proceso={editando === "nuevo" ? null : editando}
        open={editando !== null}
        onClose={() => setEditando(null)}
      />
    </section>
  );
}
