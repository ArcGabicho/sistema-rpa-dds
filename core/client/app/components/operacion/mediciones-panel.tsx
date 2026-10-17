"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Pencil, Plus, X } from "lucide-react";
import { sileo } from "sileo";
import { Cumplimiento } from "@/components/ui/operacion-badges";
import { Field } from "@/components/ui/field";
import { BUTTON_DANGER, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { formatSoles } from "@/lib/comercial";
import { formatNumero, formatPorcentaje } from "@/lib/diagnostico";
import { ahorroDelMes, estimadoDelMes, nombreMes, type Medicion } from "@/lib/operacion";
import { medicionSchema, type MedicionValues } from "@/lib/operacion-schema";
import { panelFetch } from "@/lib/panel-api";

type BotDatos = { id: number; horasMesEstimadas: number; costoHora: number; minutosPorCaso: number; enProduccionDesde: string; retiradoEl: string | null };

function MedicionDialog({
  bot,
  medicion,
  meses,
  mesInicial,
  onClose,
}: {
  bot: BotDatos;
  medicion: Medicion | null;
  meses: string[];
  mesInicial: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MedicionValues>({
    resolver: zodResolver(medicionSchema),
    defaultValues: medicion
      ? {
          mes: medicion.mes.slice(0, 7),
          ejecuciones: medicion.ejecuciones,
          ejecucionesFallidas: medicion.ejecucionesFallidas,
          casosProcesados: medicion.casosProcesados,
          casosDerivados: medicion.casosDerivados,
          notas: medicion.notas ?? "",
        }
      : { mes: mesInicial, ejecuciones: Number.NaN, ejecucionesFallidas: 0, casosProcesados: Number.NaN, casosDerivados: 0, notas: "" },
  });
  const [mes, casos] = useWatch({ control, name: ["mes", "casosProcesados"] });
  const vista = ahorroDelMes(Number.isFinite(casos) ? casos : 0, bot.minutosPorCaso, bot.costoHora);
  const estimado = estimadoDelMes(bot, mes);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const onSubmit = handleSubmit(async (v) => {
    const result = await panelFetch(`bots/${bot.id}/mediciones`, {
      method: "PUT",
      body: { ...v, mes: `${v.mes}-01`, notas: v.notas.trim() || null },
    });
    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar el registro", description: result.message });
      return;
    }
    sileo.success({ title: `Registro de ${nombreMes(v.mes)} guardado` });
    onClose();
    router.refresh();
  });

  async function quitar() {
    if (!medicion || !window.confirm(`¿Quitar el registro de ${nombreMes(medicion.mes)}?`)) return;
    const [anio, numero] = medicion.mes.slice(0, 7).split("-");
    const result = await panelFetch(`bots/${bot.id}/mediciones/${anio}/${Number(numero)}`, { method: "DELETE" });
    if (!result.ok) {
      sileo.error({ title: "No se pudo quitar el registro", description: result.message });
      return;
    }
    onClose();
    router.refresh();
  }

  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;
  const num = { valueAsNumber: true } as const;

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[92dvh] w-[min(36rem,calc(100%-1.5rem))] overflow-hidden rounded-lg bg-white p-0 shadow-flyout backdrop:bg-ink-950/40"
    >
      <form onSubmit={onSubmit} noValidate className="flex max-h-[92dvh] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="text-base font-semibold text-ink-950">{medicion ? `Registro de ${nombreMes(medicion.mes)}` : "Registrar mes"}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-md p-1.5 text-ink-500 hover:bg-brand-50 hover:text-ink-950">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2">
          <p className="text-xs text-ink-500 sm:col-span-2">Los totales del mes según el orquestador o los logs del bot.</p>
          {!medicion && (
            <Field id="med-mes" label="Mes" error={errors.mes?.message} className="sm:col-span-2">
              <select id="med-mes" className={input(!!errors.mes)} {...register("mes")}>
                {meses.map((m) => (
                  <option key={m} value={m}>
                    {nombreMes(m)}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field id="med-ejecuciones" label="Ejecuciones" error={errors.ejecuciones?.message}>
            <input id="med-ejecuciones" type="number" min={0} className={input(!!errors.ejecuciones)} {...register("ejecuciones", num)} />
          </Field>
          <Field id="med-fallidas" label="Ejecuciones fallidas" error={errors.ejecucionesFallidas?.message}>
            <input id="med-fallidas" type="number" min={0} className={input(!!errors.ejecucionesFallidas)} {...register("ejecucionesFallidas", num)} />
          </Field>
          <Field id="med-casos" label="Casos resueltos por el bot" error={errors.casosProcesados?.message}>
            <input id="med-casos" type="number" min={0} className={input(!!errors.casosProcesados)} {...register("casosProcesados", num)} />
          </Field>
          <Field id="med-derivados" label="Casos derivados a una persona" error={errors.casosDerivados?.message} hint="Excepciones del negocio; no cuentan como ahorro.">
            <input id="med-derivados" type="number" min={0} className={input(!!errors.casosDerivados)} {...register("casosDerivados", num)} />
          </Field>
          <Field id="med-notas" label="Notas" optional error={errors.notas?.message} className="sm:col-span-2">
            <input id="med-notas" placeholder="Ej. Dos días detenido por el cambio de clave" className={input(!!errors.notas)} {...register("notas")} />
          </Field>
          <dl className="grid grid-cols-3 gap-3 rounded-lg bg-brand-50 p-4 text-sm sm:col-span-2">
            <div>
              <dt className="text-xs text-ink-500">Horas liberadas</dt>
              <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">{formatNumero(vista.horas, 1)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Ahorro real</dt>
              <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">{formatSoles(vista.ahorro)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Estimado del mes</dt>
              <dd className="mt-0.5 font-semibold text-ink-950 tabular-nums">{formatSoles(estimado)}</dd>
            </div>
            <p className="col-span-3 text-xs text-ink-500">
              {formatNumero(bot.minutosPorCaso, 1)} min por caso a S/ {formatNumero(bot.costoHora, 2)} la hora.
            </p>
          </dl>
        </div>
        <footer className="flex items-center justify-between gap-2 border-t border-line px-6 py-4">
          {medicion ? (
            <button type="button" onClick={quitar} className={`${BUTTON_DANGER} px-3`}>
              Quitar
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className={BUTTON_PRIMARY}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}

// The bot's months: what it ran, handled and saved against the estimate.
// `meses` are the ones that can have a record ("YYYY-MM", from its launch
// to the current one); `pendientes`, the closed ones still without it.
export function MedicionesPanel({
  bot,
  mediciones,
  meses,
  pendientes,
}: {
  bot: BotDatos;
  mediciones: Medicion[];
  meses: string[];
  pendientes: string[];
}) {
  const [dialogo, setDialogo] = useState<{ medicion: Medicion | null; mes: string } | null>(null);
  const filas = [...mediciones].reverse();
  const mesNuevo = pendientes.at(-1)?.slice(0, 7) ?? meses.find((m) => !mediciones.some((x) => x.mes.startsWith(m))) ?? meses.at(-1) ?? "";

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 p-5">
        <h2 className="text-base font-semibold text-ink-950">
          Registro mensual <span className="font-normal text-ink-500">{mediciones.length}</span>
        </h2>
        {meses.length > 0 && (
          <button type="button" onClick={() => setDialogo({ medicion: null, mes: mesNuevo })} className={`${BUTTON_SECONDARY} h-9 shrink-0 px-3 whitespace-nowrap`}>
            <Plus className="h-4 w-4" />
            Registrar mes
          </button>
        )}
      </div>
      {pendientes.length > 0 && (
        <p className="flex items-start gap-2 border-t border-line bg-red-50 px-5 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Falta el registro de {pendientes.map((m) => nombreMes(m)).join(", ")}: sin él, el ahorro de ese mes no cuenta.
        </p>
      )}
      {filas.length === 0 ? (
        <p className="border-t border-line px-5 py-4 text-sm text-ink-500">
          {meses.length === 0 ? "Aún no entra en producción." : "Sin registros todavía. Se registra cada mes con los totales del orquestador."}
        </p>
      ) : (
        <>
          <table className="hidden w-full border-t border-line text-sm md:table">
            <thead className="bg-brand-50 text-left text-xs whitespace-nowrap text-ink-500">
              <tr>
                <th className="px-5 py-2.5 font-medium">Mes</th>
                <th className="px-3 py-2.5 text-right font-medium">Ejecuciones</th>
                <th className="px-3 py-2.5 text-right font-medium">Casos</th>
                <th className="px-3 py-2.5 text-right font-medium">Horas</th>
                <th className="px-3 py-2.5 text-right font-medium">Ahorro real</th>
                <th className="px-3 py-2.5 font-medium">Frente al estimado</th>
                <th className="w-12 px-3 py-2.5">
                  <span className="sr-only">Editar</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filas.map((m) => (
                <tr key={m.mes} className="align-top">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-950 first-letter:uppercase">{nombreMes(m.mes)}</p>
                    {m.notas && <p className="mt-0.5 max-w-56 text-xs text-ink-500">{m.notas}</p>}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatNumero(m.ejecuciones)}
                    <p className="text-xs whitespace-nowrap text-ink-500">{m.tasaExito === null ? "—" : `${formatPorcentaje(m.tasaExito)} de éxito`}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatNumero(m.casosProcesados)}
                    {m.casosDerivados > 0 && <p className="text-xs whitespace-nowrap text-ink-500">{formatNumero(m.casosDerivados)} derivados</p>}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatNumero(m.horasAhorradas, 1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <span className="font-semibold whitespace-nowrap text-ink-950">{formatSoles(m.ahorroReal)}</span>
                    <p className="text-xs whitespace-nowrap text-ink-500">de {formatSoles(m.ahorroEstimado)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <Cumplimiento valor={m.cumplimiento} />
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => setDialogo({ medicion: m, mes: m.mes.slice(0, 7) })}
                      aria-label={`Editar el registro de ${nombreMes(m.mes)}`}
                      className="rounded-md p-1.5 text-ink-500 hover:bg-brand-50 hover:text-ink-950"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-line border-t border-line md:hidden">
            {filas.map((m) => (
              <li key={m.mes}>
                <button type="button" onClick={() => setDialogo({ medicion: m, mes: m.mes.slice(0, 7) })} className="flex w-full flex-col gap-1.5 px-5 py-3 text-left hover:bg-brand-50">
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="font-medium text-ink-950 first-letter:uppercase">{nombreMes(m.mes)}</span>
                    <Cumplimiento valor={m.cumplimiento} />
                  </span>
                  <span className="text-xs text-ink-500">
                    {formatSoles(m.ahorroReal)} de {formatSoles(m.ahorroEstimado)} · {formatNumero(m.casosProcesados)} casos · {formatNumero(m.horasAhorradas, 1)} h
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {dialogo && (
        <MedicionDialog
          key={dialogo.medicion?.mes ?? `nuevo-${dialogo.mes}`}
          bot={bot}
          medicion={dialogo.medicion}
          meses={meses}
          mesInicial={dialogo.mes}
          onClose={() => setDialogo(null)}
        />
      )}
    </section>
  );
}
