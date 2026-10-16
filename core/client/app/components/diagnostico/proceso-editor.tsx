"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { sileo } from "sileo";
import { CuadranteBadge } from "@/components/ui/diagnostico-badges";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { SERVICIOS, formatSoles } from "@/lib/comercial";
import { CRITERIOS, formatNumero, formatPayback, formatPorcentaje, type Proceso, type ProcesoInput } from "@/lib/diagnostico";
import { AREAS_SUGERIDAS, procesoSchema, type ProcesoValues } from "@/lib/diagnostico-schema";
import { panelFetch } from "@/lib/panel-api";
import { calcular } from "@/lib/roi";

const VACIO: ProcesoValues = {
  nombre: "",
  area: "",
  descripcion: "",
  servicio: "rpa",
  ejecucionesMes: Number.NaN,
  minutosPorEjecucion: Number.NaN,
  personas: 1,
  tasaError: 0,
  costoHora: "",
  reglasClaras: 3,
  datosDigitales: 3,
  sistemasEstables: 3,
  procesoEstandar: 3,
  pocasExcepciones: 3,
  porcentajeAutomatizable: 70,
  costoImplementacion: 0,
  costoMensual: 0,
};

function toValues(p: Proceso): ProcesoValues {
  return {
    nombre: p.nombre,
    area: p.area ?? "",
    descripcion: p.descripcion ?? "",
    servicio: p.servicio,
    ejecucionesMes: p.ejecucionesMes,
    minutosPorEjecucion: p.minutosPorEjecucion,
    personas: p.personas,
    tasaError: p.tasaError,
    costoHora: p.costoHora?.toString() ?? "",
    reglasClaras: p.reglasClaras,
    datosDigitales: p.datosDigitales,
    sistemasEstables: p.sistemasEstables,
    procesoEstandar: p.procesoEstandar,
    pocasExcepciones: p.pocasExcepciones,
    porcentajeAutomatizable: p.porcentajeAutomatizable,
    costoImplementacion: p.costoImplementacion,
    costoMensual: p.costoMensual,
  };
}

// Form values -> API body (and preview input): NaN while typing counts as 0.
function toInput(v: ProcesoValues): ProcesoInput {
  const n = (x: number) => (Number.isFinite(x) ? x : 0);
  return {
    nombre: v.nombre.trim(),
    area: v.area.trim() || null,
    descripcion: v.descripcion.trim() || null,
    servicio: v.servicio,
    ejecucionesMes: n(v.ejecucionesMes),
    minutosPorEjecucion: n(v.minutosPorEjecucion),
    personas: n(v.personas),
    tasaError: n(v.tasaError),
    costoHora: v.costoHora.trim() === "" ? null : Number(v.costoHora),
    reglasClaras: v.reglasClaras,
    datosDigitales: v.datosDigitales,
    sistemasEstables: v.sistemasEstables,
    procesoEstandar: v.procesoEstandar,
    pocasExcepciones: v.pocasExcepciones,
    porcentajeAutomatizable: n(v.porcentajeAutomatizable),
    costoImplementacion: n(v.costoImplementacion),
    costoMensual: n(v.costoMensual),
  };
}

// Live figures while the form is filled in (lib/roi mirrors the API's math).
function Vista({ control, costoHora }: { control: Control<ProcesoValues>; costoHora: number }) {
  const values = useWatch({ control }) as ProcesoValues;
  const c = calcular(toInput(values), costoHora);
  const filas: [string, string][] = [
    ["Horas al mes hoy", formatNumero(c.horasMes, 1)],
    ["Horas liberadas al mes", formatNumero(c.horasLiberadasMes, 1)],
    ["Equivalente", `${formatNumero(c.fte, 2)} FTE`],
    ["Ahorro anual", formatSoles(c.ahorroAnual)],
    ["Costo del primer año", formatSoles(c.costoPrimerAnio)],
    ["ROI a 12 meses", formatPorcentaje(c.roi12Meses)],
    ["Recuperación", formatPayback(c.paybackMeses)],
  ];

  return (
    <aside className="rounded-lg bg-brand-50 p-5 lg:sticky lg:top-0">
      <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Estimación</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <CuadranteBadge cuadrante={c.cuadrante} />
        <span className="text-sm text-ink-700">
          Factibilidad <span className="font-semibold text-ink-950">{c.factibilidad}</span>/100
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-700" style={{ width: `${c.factibilidad}%` }} />
      </div>
      <dl className="mt-4 divide-y divide-line text-sm">
        {filas.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2">
            <dt className="text-ink-500">{label}</dt>
            <dd className="font-semibold text-ink-950 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

export function ProcesoEditor({
  diagnosticoId,
  costoHora,
  proceso,
  open,
  onClose,
}: {
  diagnosticoId: number;
  costoHora: number;
  // The process being edited; none to add one.
  proceso: Proceso | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProcesoValues>({ resolver: zodResolver(procesoSchema), defaultValues: VACIO });
  const puntajes = useWatch({ control, name: CRITERIOS.map((c) => c.key) });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      reset(proceso ? toValues(proceso) : VACIO);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, proceso, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const body = toInput(values);
    const result = proceso
      ? await panelFetch(`procesos/${proceso.id}`, { method: "PUT", body })
      : await panelFetch(`diagnosticos/${diagnosticoId}/procesos`, { method: "POST", body });
    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar el proceso", description: result.message });
      return;
    }
    sileo.success({ title: proceso ? "Proceso actualizado" : "Proceso agregado", description: body.nombre });
    onClose();
    router.refresh();
  });

  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;
  const num = { valueAsNumber: true } as const;

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[92dvh] w-[min(64rem,calc(100%-1.5rem))] overflow-hidden rounded-lg bg-white p-0 shadow-flyout backdrop:bg-ink-950/40"
    >
      <form onSubmit={onSubmit} noValidate className="flex max-h-[92dvh] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="text-base font-semibold text-ink-950">{proceso ? "Editar proceso" : "Agregar proceso"}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-md p-1.5 text-ink-500 hover:bg-brand-50 hover:text-ink-950">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex flex-col gap-6">
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-3 text-sm font-semibold text-ink-950">El proceso</legend>
              <Field id="proc-nombre" label="Nombre" error={errors.nombre?.message} className="sm:col-span-2">
                <input id="proc-nombre" placeholder="Ej. Conciliación bancaria diaria" className={input(!!errors.nombre)} {...register("nombre")} />
              </Field>
              <Field id="proc-area" label="Área" optional>
                <input id="proc-area" list="proc-areas" className={input(false)} {...register("area")} />
                <datalist id="proc-areas">
                  {AREAS_SUGERIDAS.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </Field>
              <Field id="proc-servicio" label="Solución sugerida">
                <select id="proc-servicio" className={input(false)} {...register("servicio")}>
                  {SERVICIOS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="proc-descripcion" label="Cómo se hace hoy" optional className="sm:col-span-2">
                <textarea
                  id="proc-descripcion"
                  rows={2}
                  placeholder="Ej. Descargan los movimientos del banco y los cruzan en Excel con el ERP."
                  className={`${input(false)} h-auto resize-y py-2.5`}
                  {...register("descripcion")}
                />
              </Field>
            </fieldset>

            <fieldset className="grid gap-4 border-t border-line pt-5 sm:grid-cols-4">
              <legend className="mb-3 text-sm font-semibold text-ink-950">Volumen actual</legend>
              <Field id="proc-ejecuciones" label="Veces al mes" error={errors.ejecucionesMes?.message}>
                <input id="proc-ejecuciones" type="number" min={0} className={input(!!errors.ejecucionesMes)} {...register("ejecucionesMes", num)} />
              </Field>
              <Field id="proc-minutos" label="Minutos cada vez" error={errors.minutosPorEjecucion?.message}>
                <input id="proc-minutos" type="number" min={0} step="any" className={input(!!errors.minutosPorEjecucion)} {...register("minutosPorEjecucion", num)} />
              </Field>
              <Field id="proc-personas" label="Personas" error={errors.personas?.message}>
                <input id="proc-personas" type="number" min={0} className={input(!!errors.personas)} {...register("personas", num)} />
              </Field>
              <Field id="proc-error" label="% de error" error={errors.tasaError?.message}>
                <input id="proc-error" type="number" min={0} max={100} step="any" className={input(!!errors.tasaError)} {...register("tasaError", num)} />
              </Field>
            </fieldset>

            <fieldset className="border-t border-line pt-5">
              <legend className="mb-1 text-sm font-semibold text-ink-950">Factibilidad</legend>
              <p className="mb-4 text-xs text-ink-500">De 1 (nada) a 5 (totalmente).</p>
              <div className="flex flex-col gap-3">
                {CRITERIOS.map((c, i) => (
                  <div key={c.key} className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div>
                      <p className="text-sm font-medium text-ink-950">{c.label}</p>
                      <p className="text-xs text-ink-500">{c.ayuda}</p>
                    </div>
                    <div className="flex gap-1" role="radiogroup" aria-label={c.label}>
                      {[1, 2, 3, 4, 5].map((n) => {
                        const selected = puntajes[i] === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setValue(c.key, n, { shouldDirty: true })}
                            className={`h-9 w-9 rounded-md border text-sm font-semibold transition-colors ${
                              selected ? "border-brand-700 bg-brand-700 text-white" : "border-line text-ink-700 hover:bg-brand-50"
                            }`}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>

            <fieldset className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
              <legend className="mb-3 text-sm font-semibold text-ink-950">Automatización y costos</legend>
              <Field id="proc-automatizable" label="% del trabajo que haría la solución" error={errors.porcentajeAutomatizable?.message}>
                <input id="proc-automatizable" type="number" min={0} max={100} step="any" className={input(!!errors.porcentajeAutomatizable)} {...register("porcentajeAutomatizable", num)} />
              </Field>
              <Field id="proc-costo-hora" label="Costo por hora (S/)" optional error={errors.costoHora?.message} hint={`Vacío: el del diagnóstico (S/ ${costoHora}).`}>
                <input id="proc-costo-hora" inputMode="decimal" placeholder={String(costoHora)} className={input(!!errors.costoHora)} {...register("costoHora")} />
              </Field>
              <Field id="proc-implementacion" label="Implementación (S/)" error={errors.costoImplementacion?.message} hint="Costo único de construirla.">
                <input id="proc-implementacion" type="number" min={0} step="any" className={input(!!errors.costoImplementacion)} {...register("costoImplementacion", num)} />
              </Field>
              <Field id="proc-mensual" label="Costo mensual (S/)" error={errors.costoMensual?.message} hint="Licencias, infraestructura y soporte.">
                <input id="proc-mensual" type="number" min={0} step="any" className={input(!!errors.costoMensual)} {...register("costoMensual", num)} />
              </Field>
            </fieldset>
          </div>

          <Vista control={control} costoHora={costoHora} />
        </div>

        <footer className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className={BUTTON_PRIMARY}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {proceso ? "Guardar cambios" : "Agregar proceso"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
