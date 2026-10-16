"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { EmpresaPicker, type EmpresaOption } from "@/components/comercial/empresa-picker";
import { CuadranteBadge } from "@/components/ui/diagnostico-badges";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { formatSoles } from "@/lib/comercial";
import { formatPayback, type Diagnostico } from "@/lib/diagnostico";
import { MONEDAS } from "@/lib/propuesta";
import { panelFetch } from "@/lib/panel-api";

const RECOMENDADOS = ["quick_win", "estrategico", "mejora_menor"];

// Start a proposal: from a diagnosis (pick which processes go in the
// scope), from an opportunity, or for any company.
export function NuevaPropuestaForm({
  diagnostico,
  oportunidad,
  empresa,
}: {
  diagnostico?: Diagnostico;
  oportunidad?: { id: number; titulo: string; empresaNombre: string };
  empresa?: EmpresaOption;
}) {
  const router = useRouter();
  const [empresaOption, setEmpresaOption] = useState<EmpresaOption | null>(empresa ?? null);
  const [titulo, setTitulo] = useState("Propuesta de automatización");
  const [moneda, setMoneda] = useState("PEN");
  const [elegidos, setElegidos] = useState<number[]>(
    diagnostico?.procesos.filter((p) => RECOMENDADOS.includes(p.calculo.cuadrante)).map((p) => p.id) ?? [],
  );
  const [enviando, setEnviando] = useState(false);
  const fijo = diagnostico ?? oportunidad;
  const input = `${INPUT_BASE} ${inputState(false)}`;

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!fijo && !empresaOption) {
      sileo.error({ title: "Falta la empresa", description: "Elige para quién es la propuesta." });
      return;
    }
    if (diagnostico && elegidos.length === 0) {
      sileo.error({ title: "Elige al menos un proceso", description: "Los procesos elegidos forman el alcance." });
      return;
    }
    setEnviando(true);
    const result = await panelFetch<{ id: number }>("propuestas", {
      method: "POST",
      body: {
        diagnosticoId: diagnostico?.id ?? null,
        oportunidadId: diagnostico ? diagnostico.oportunidadId : (oportunidad?.id ?? null),
        empresaId: diagnostico ? diagnostico.empresaId : (empresaOption?.id ?? null),
        procesoIds: diagnostico ? elegidos : null,
        titulo: titulo.trim(),
        moneda,
      },
    });
    setEnviando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo crear la propuesta", description: result.message });
      return;
    }
    sileo.success({ title: "Borrador creado", description: "Revisa precios, cronograma y textos antes de enviarla." });
    router.push(`/dashboard/propuestas/${result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={crear} className={`${CARD} max-w-3xl`}>
      <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <Field id="np-empresa" label="Cliente" className="sm:col-span-2">
          {fijo ? (
            <p className={`${input} flex items-center bg-brand-50 font-medium`}>
              {diagnostico ? `${diagnostico.empresaNombre} · ${diagnostico.titulo}` : `${oportunidad!.empresaNombre} · ${oportunidad!.titulo}`}
            </p>
          ) : (
            <EmpresaPicker id="np-empresa" value={empresaOption} onChange={setEmpresaOption} />
          )}
        </Field>
        <Field id="np-titulo" label="Título">
          <input id="np-titulo" value={titulo} maxLength={200} onChange={(e) => setTitulo(e.target.value)} className={input} />
        </Field>
        <Field id="np-moneda" label="Moneda">
          <select id="np-moneda" value={moneda} onChange={(e) => setMoneda(e.target.value)} className={input}>
            {MONEDAS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {diagnostico && (
        <fieldset className="border-t border-line p-6 sm:p-8">
          <legend className="sr-only">Procesos del alcance</legend>
          <p className="text-sm font-semibold text-ink-950">Procesos que entran en el alcance</p>
          <p className="mt-1 text-xs text-ink-500">
            Cada uno será un ítem de implementación a su costo estimado; sus costos mensuales se suman en el servicio mensual.
          </p>
          <ul className="mt-4 divide-y divide-line rounded-md border border-line">
            {diagnostico.procesos.map((p) => {
              const marcado = elegidos.includes(p.id);
              return (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-brand-50">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => setElegidos((ids) => (marcado ? ids.filter((x) => x !== p.id) : [...ids, p.id]))}
                      className="mt-1 h-4 w-4 accent-brand-700"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-950">
                        {p.nombre}
                        <CuadranteBadge cuadrante={p.calculo.cuadrante} />
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {formatSoles(p.costoImplementacion)} de implementación · ahorra {formatSoles(p.calculo.ahorroAnual)} al año ·{" "}
                        {formatPayback(p.calculo.paybackMeses).toLowerCase()}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <Link
          href={diagnostico ? `/dashboard/diagnosticos/${diagnostico.id}` : oportunidad ? `/dashboard/oportunidades/${oportunidad.id}` : "/dashboard/propuestas"}
          className={BUTTON_SECONDARY}
        >
          Cancelar
        </Link>
        <button type="submit" disabled={enviando} className={BUTTON_PRIMARY}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear borrador
        </button>
      </div>
    </form>
  );
}
