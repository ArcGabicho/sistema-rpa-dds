"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Loader2, Plus, X } from "lucide-react";
import { sileo } from "sileo";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import type { TeamUser } from "@/lib/comercial";
import { formatPayback, formatPorcentaje } from "@/lib/diagnostico";
import { ITEM_TIPOS, MONEDAS, calcularTotales, formatMoneda, type Propuesta } from "@/lib/propuesta";
import { propuestaSchema, type PropuestaValues } from "@/lib/propuesta-schema";
import { panelFetch } from "@/lib/panel-api";
import { UsuarioOptions } from "@/components/ui/usuario-options";

function toValues(p: Propuesta): PropuestaValues {
  return {
    titulo: p.titulo,
    moneda: p.moneda as PropuestaValues["moneda"],
    descuentoPorcentaje: p.descuentoPorcentaje,
    ahorroAnualEstimado: p.ahorroAnualEstimado?.toString() ?? "",
    validaHasta: p.validaHasta?.slice(0, 10) ?? "",
    responsableId: p.responsableId?.toString() ?? "",
    introduccion: p.introduccion ?? "",
    supuestos: p.supuestos ?? "",
    exclusiones: p.exclusiones ?? "",
    condicionesPago: p.condicionesPago ?? "",
    items: p.items.map((i) => ({
      tipo: i.tipo as "implementacion" | "mensual",
      descripcion: i.descripcion,
      detalle: i.detalle ?? "",
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      procesoOrigenId: i.procesoOrigenId ?? null,
    })),
    fases: p.fases.map((f) => ({ nombre: f.nombre, descripcion: f.descripcion ?? "", semanas: f.semanas })),
  };
}

const n = (x: number) => (Number.isFinite(x) ? x : 0);

// Live totals beside the form (lib/propuesta mirrors the API's math).
function Totales({ control }: { control: Control<PropuestaValues> }) {
  const [items, fases, descuento, ahorro, moneda] = useWatch({
    control,
    name: ["items", "fases", "descuentoPorcentaje", "ahorroAnualEstimado", "moneda"],
  });
  const t = calcularTotales(
    (items ?? []).map((i) => ({ ...i, detalle: null, cantidad: n(i.cantidad), precioUnitario: n(i.precioUnitario) })),
    (fases ?? []).map((f) => ({ semanas: n(f.semanas) })),
    n(descuento),
    ahorro?.trim() ? Number(ahorro) : null,
  );
  const m = (v: number) => formatMoneda(v, moneda, 2);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Implementación</p>
        <dl className="mt-2 flex flex-col gap-1.5">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-500">Subtotal</dt>
            <dd className="tabular-nums">{m(t.subtotalImplementacion)}</dd>
          </div>
          {t.descuento > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Descuento</dt>
              <dd className="tabular-nums">−{m(t.descuento)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-ink-500">IGV (18 %)</dt>
            <dd className="tabular-nums">{m(t.igvImplementacion)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-line pt-1.5 font-semibold text-ink-950">
            <dt>Total</dt>
            <dd className="tabular-nums">{m(t.totalImplementacion)}</dd>
          </div>
        </dl>
      </div>
      <div>
        <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Mensual</p>
        <dl className="mt-2 flex flex-col gap-1.5">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-500">Base + IGV</dt>
            <dd className="tabular-nums">
              {m(t.baseMensual)} + {m(t.igvMensual)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-line pt-1.5 font-semibold text-ink-950">
            <dt>Total al mes</dt>
            <dd className="tabular-nums">{m(t.totalMensual)}</dd>
          </div>
        </dl>
      </div>
      <dl className="flex flex-col gap-1.5 rounded-md bg-brand-50 p-3">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-500">Primer año (sin IGV)</dt>
          <dd className="font-semibold tabular-nums text-ink-950">{formatMoneda(t.valorPrimerAnio, moneda)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-500">Plazo</dt>
          <dd className="tabular-nums text-ink-950">
            {t.semanas} {t.semanas === 1 ? "semana" : "semanas"}
          </dd>
        </div>
        {ahorro?.trim() && (
          <>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Recuperación</dt>
              <dd className="text-ink-950">{formatPayback(t.paybackMeses)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">ROI a 12 meses</dt>
              <dd className="tabular-nums text-ink-950">{formatPorcentaje(t.roi12Meses)}</dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
}

// The line's amount, as the row is typed in.
function Subtotal({ control, index }: { control: Control<PropuestaValues>; index: number }) {
  const [cantidad, precio, moneda] = useWatch({ control, name: [`items.${index}.cantidad`, `items.${index}.precioUnitario`, "moneda"] });
  return (
    <p className="flex h-9 items-center justify-end text-sm font-semibold tabular-nums text-ink-950">
      {formatMoneda(n(cantidad) * n(precio), moneda, 2)}
    </p>
  );
}

function Mover({
  index,
  total,
  onMove,
  onRemove,
  etiqueta,
}: {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  etiqueta: string;
}) {
  const boton = "rounded-md p-1.5 text-ink-500 transition-colors hover:bg-brand-50 hover:text-ink-950 disabled:opacity-30";
  return (
    <div className="flex shrink-0 gap-0.5">
      <button type="button" disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label={`Subir ${etiqueta}`} className={boton}>
        <ArrowUp className="h-4 w-4" />
      </button>
      <button type="button" disabled={index === total - 1} onClick={() => onMove(index, index + 1)} aria-label={`Bajar ${etiqueta}`} className={boton}>
        <ArrowDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(index)}
        aria-label={`Quitar ${etiqueta}`}
        className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// The draft as one document: data, scope and prices, schedule and terms,
// saved together. Sent proposals aren't edited here (see PropuestaResumen).
export function PropuestaEditor({ propuesta, users }: { propuesta: Propuesta; users: TeamUser[] }) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PropuestaValues>({ resolver: zodResolver(propuestaSchema), defaultValues: toValues(propuesta) });
  const items = useFieldArray({ control, name: "items" });
  const fases = useFieldArray({ control, name: "fases" });
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;
  const num = { valueAsNumber: true } as const;

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!isDirty) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [isDirty]);

  const onSubmit = handleSubmit(async (v) => {
    const result = await panelFetch(`propuestas/${propuesta.id}`, {
      method: "PUT",
      body: {
        titulo: v.titulo.trim(),
        moneda: v.moneda,
        descuentoPorcentaje: v.descuentoPorcentaje,
        ahorroAnualEstimado: v.ahorroAnualEstimado.trim() ? Number(v.ahorroAnualEstimado) : null,
        validaHasta: v.validaHasta || null,
        responsableId: v.responsableId ? Number(v.responsableId) : null,
        introduccion: v.introduccion.trim() || null,
        supuestos: v.supuestos.trim() || null,
        exclusiones: v.exclusiones.trim() || null,
        condicionesPago: v.condicionesPago.trim() || null,
        items: v.items.map((i) => ({ ...i, descripcion: i.descripcion.trim(), detalle: i.detalle.trim() || null })),
        fases: v.fases.map((f) => ({ ...f, nombre: f.nombre.trim(), descripcion: f.descripcion.trim() || null })),
      },
    });
    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar la propuesta", description: result.message });
      return;
    }
    sileo.success({ title: "Propuesta guardada" });
    reset(v);
    router.refresh();
  });

  const nuevoItem = (tipo: "implementacion" | "mensual") =>
    items.append({ tipo, descripcion: "", detalle: "", cantidad: 1, precioUnitario: 0, procesoOrigenId: null }, { shouldFocus: true });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className={`${CARD} grid gap-5 p-6 sm:grid-cols-2`}>
          <h2 className="text-base font-semibold text-ink-950 sm:col-span-2">Datos</h2>
          <Field id="prop-titulo" label="Título" error={errors.titulo?.message} className="sm:col-span-2">
            <input id="prop-titulo" className={input(!!errors.titulo)} {...register("titulo")} />
          </Field>
          <Field id="prop-moneda" label="Moneda">
            <select id="prop-moneda" className={input(false)} {...register("moneda")}>
              {MONEDAS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="prop-valida" label="Válida hasta" optional hint="Vacío: 30 días desde que se envía.">
            <input id="prop-valida" type="date" className={input(false)} {...register("validaHasta")} />
          </Field>
          <Field id="prop-descuento" label="Descuento sobre la implementación (%)" error={errors.descuentoPorcentaje?.message}>
            <input id="prop-descuento" type="number" min={0} max={100} step="any" className={input(!!errors.descuentoPorcentaje)} {...register("descuentoPorcentaje", num)} />
          </Field>
          <Field
            id="prop-ahorro"
            label="Ahorro anual que se espera"
            optional
            error={errors.ahorroAnualEstimado?.message}
            hint="Del diagnóstico: muestra al cliente en cuánto se recupera."
          >
            <input id="prop-ahorro" inputMode="decimal" className={input(!!errors.ahorroAnualEstimado)} {...register("ahorroAnualEstimado")} />
          </Field>
          <Field id="prop-responsable" label="Responsable" className="sm:col-span-2 sm:max-w-sm">
            <select id="prop-responsable" className={input(false)} {...register("responsableId")}>
              <option value="">Sin asignar</option>
              <UsuarioOptions users={users} actual={propuesta.responsableId} />
            </select>
          </Field>
        </section>

        <section className={`${CARD} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink-950">Alcance e inversión</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => nuevoItem("implementacion")} className={`${BUTTON_SECONDARY} h-9 px-3`}>
                <Plus className="h-4 w-4" />
                Implementación
              </button>
              <button type="button" onClick={() => nuevoItem("mensual")} className={`${BUTTON_SECONDARY} h-9 px-3`}>
                <Plus className="h-4 w-4" />
                Mensual
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-ink-500">Precios sin IGV. Cada ítem de implementación es una parte del alcance en el documento.</p>

          {items.fields.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-line px-4 py-6 text-center text-sm text-ink-500">
              Aún no hay ítems. Agrega lo que DDS va a entregar.
            </p>
          ) : (
            <ol className="mt-4 flex flex-col gap-3">
              {items.fields.map((field, i) => {
                const e = errors.items?.[i];
                return (
                  <li key={field.id} className="rounded-md border border-line p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <input
                          aria-label="Descripción"
                          placeholder="Ej. Automatización: conciliación bancaria"
                          className={`${input(!!e?.descripcion)} h-9 font-medium`}
                          {...register(`items.${i}.descripcion`)}
                        />
                        {e?.descripcion && <p className="mt-1 text-xs text-red-500">{e.descripcion.message}</p>}
                      </div>
                      <Mover index={i} total={items.fields.length} onMove={items.move} onRemove={items.remove} etiqueta={`el ítem ${i + 1}`} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[9rem_6rem_9rem_minmax(0,1fr)]">
                      <select aria-label="Tipo" className={`${input(false)} h-9`} {...register(`items.${i}.tipo`)}>
                        {ITEM_TIPOS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.value === "implementacion" ? "Pago único" : "Mensual"}
                          </option>
                        ))}
                      </select>
                      <input aria-label="Cantidad" type="number" min={0} step="any" className={`${input(!!e?.cantidad)} h-9`} {...register(`items.${i}.cantidad`, num)} />
                      <input aria-label="Precio unitario" type="number" min={0} step="any" className={`${input(!!e?.precioUnitario)} h-9`} {...register(`items.${i}.precioUnitario`, num)} />
                      <Subtotal control={control} index={i} />
                    </div>
                    <textarea
                      aria-label="Qué incluye"
                      rows={2}
                      placeholder="Qué incluye (aparece en el alcance del documento)"
                      className={`${input(false)} mt-2 h-auto resize-y py-2 text-xs`}
                      {...register(`items.${i}.detalle`)}
                    />
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className={`${CARD} p-6`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink-950">Cronograma</h2>
            <button
              type="button"
              onClick={() => fases.append({ nombre: "", descripcion: "", semanas: 1 }, { shouldFocus: true })}
              className={`${BUTTON_SECONDARY} h-9 px-3`}
            >
              <Plus className="h-4 w-4" />
              Fase
            </button>
          </div>
          <ol className="mt-4 flex flex-col gap-3">
            {fases.fields.map((field, i) => {
              const e = errors.fases?.[i];
              return (
                <li key={field.id} className="rounded-md border border-line p-3">
                  <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_6rem_auto]">
                    <div>
                      <input aria-label="Fase" placeholder="Ej. Desarrollo" className={`${input(!!e?.nombre)} h-9`} {...register(`fases.${i}.nombre`)} />
                      {e?.nombre && <p className="mt-1 text-xs text-red-500">{e.nombre.message}</p>}
                    </div>
                    <div className="relative">
                      <input aria-label="Semanas" type="number" min={1} className={`${input(!!e?.semanas)} h-9 pr-10`} {...register(`fases.${i}.semanas`, num)} />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-ink-400">sem.</span>
                    </div>
                    <Mover index={i} total={fases.fields.length} onMove={fases.move} onRemove={fases.remove} etiqueta={`la fase ${i + 1}`} />
                  </div>
                  <input aria-label="Descripción de la fase" placeholder="Qué pasa en esta fase" className={`${input(false)} mt-2 h-9 text-xs`} {...register(`fases.${i}.descripcion`)} />
                </li>
              );
            })}
          </ol>
        </section>

        <section className={`${CARD} grid gap-5 p-6`}>
          <h2 className="text-base font-semibold text-ink-950">Textos del documento</h2>
          <Field id="prop-intro" label="Contexto" optional error={errors.introduccion?.message}>
            <textarea id="prop-intro" rows={4} className={`${input(!!errors.introduccion)} h-auto resize-y py-2.5`} {...register("introduccion")} />
          </Field>
          <Field id="prop-pago" label="Condiciones de pago" optional error={errors.condicionesPago?.message}>
            <textarea id="prop-pago" rows={2} className={`${input(!!errors.condicionesPago)} h-auto resize-y py-2.5`} {...register("condicionesPago")} />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="prop-supuestos" label="Supuestos" optional hint="Uno por línea." error={errors.supuestos?.message}>
              <textarea id="prop-supuestos" rows={5} className={`${input(!!errors.supuestos)} h-auto resize-y py-2.5`} {...register("supuestos")} />
            </Field>
            <Field id="prop-exclusiones" label="No incluye" optional hint="Uno por línea." error={errors.exclusiones?.message}>
              <textarea id="prop-exclusiones" rows={5} className={`${input(!!errors.exclusiones)} h-auto resize-y py-2.5`} {...register("exclusiones")} />
            </Field>
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-0 xl:self-start">
        <section className={`${CARD} p-5`}>
          <h2 className="mb-4 text-base font-semibold text-ink-950">Totales</h2>
          <Totales control={control} />
        </section>
        <button type="submit" disabled={isSubmitting || !isDirty} className={BUTTON_PRIMARY}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isDirty ? "Guardar cambios" : "Guardado"}
        </button>
      </aside>
    </form>
  );
}
