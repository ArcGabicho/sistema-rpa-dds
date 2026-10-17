"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { EmpresaPicker, type EmpresaOption } from "@/components/comercial/empresa-picker";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { SERVICIOS, formatSoles, type TeamUser } from "@/lib/comercial";
import { BOT_ESTADOS, PLATAFORMAS_SUGERIDAS, type BorradorBot, type Bot } from "@/lib/operacion";
import { botSchema, type BotValues } from "@/lib/operacion-schema";
import { panelFetch } from "@/lib/panel-api";

function toBody(v: BotValues) {
  const n = (x: number) => (Number.isFinite(x) ? x : 0);
  return {
    nombre: v.nombre.trim(),
    descripcion: v.descripcion.trim() || null,
    servicio: v.servicio,
    estado: v.estado,
    plataforma: v.plataforma.trim() || null,
    horario: v.horario.trim() || null,
    enProduccionDesde: v.enProduccionDesde,
    retiradoEl: v.estado === "retirado" && v.retiradoEl ? v.retiradoEl : null,
    responsableId: v.responsableId ? Number(v.responsableId) : null,
    horasMesEstimadas: n(v.horasMesEstimadas),
    costoHora: n(v.costoHora),
    minutosPorCaso: n(v.minutosPorCaso),
  };
}

// Registers a bot in production — from a project's process (its company
// and the diagnosis's figures come with it) or for a company — or edits one.
export function BotForm({
  bot,
  borrador,
  users,
  defaultResponsableId,
  today,
}: {
  bot?: Bot;
  borrador?: BorradorBot | null;
  users: TeamUser[];
  defaultResponsableId?: number;
  today: string;
}) {
  const router = useRouter();
  const [empresa, setEmpresa] = useState<EmpresaOption | null>(null);
  const [empresaError, setEmpresaError] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BotValues>({
    resolver: zodResolver(botSchema),
    defaultValues: bot
      ? {
          nombre: bot.nombre,
          descripcion: bot.descripcion ?? "",
          servicio: bot.servicio,
          estado: bot.estado as BotValues["estado"],
          plataforma: bot.plataforma ?? "",
          horario: bot.horario ?? "",
          enProduccionDesde: bot.enProduccionDesde.slice(0, 10),
          retiradoEl: bot.retiradoEl?.slice(0, 10) ?? "",
          responsableId: bot.responsableId?.toString() ?? "",
          horasMesEstimadas: bot.horasMesEstimadas,
          costoHora: bot.costoHora,
          minutosPorCaso: bot.minutosPorCaso,
        }
      : {
          nombre: borrador?.nombre ?? "",
          descripcion: "",
          servicio: borrador?.servicio ?? "rpa",
          estado: "activo",
          plataforma: "",
          horario: "",
          enProduccionDesde: today,
          retiradoEl: "",
          responsableId: defaultResponsableId?.toString() ?? "",
          horasMesEstimadas: borrador?.horasMesEstimadas ?? Number.NaN,
          costoHora: borrador?.costoHora ?? Number.NaN,
          minutosPorCaso: borrador?.minutosPorCaso ?? Number.NaN,
        },
  });
  const [estado, horas, costo] = useWatch({ control, name: ["estado", "horasMesEstimadas", "costoHora"] });
  const estimado = Number.isFinite(horas) && Number.isFinite(costo) ? horas * costo : null;
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;
  const num = { valueAsNumber: true } as const;

  const onSubmit = handleSubmit(async (values) => {
    const body = toBody(values);
    if (bot) {
      const result = await panelFetch(`bots/${bot.id}`, { method: "PUT", body });
      if (!result.ok) {
        sileo.error({ title: "No se pudo guardar el bot", description: result.message });
        return;
      }
      sileo.success({ title: "Bot actualizado" });
      router.push(`/dashboard/bots/${bot.id}`);
      router.refresh();
      return;
    }

    if (!borrador && !empresa) {
      setEmpresaError(true);
      return;
    }
    const result = await panelFetch<{ id: number; botId?: number }>("bots", {
      method: "POST",
      body: { ...body, procesoProyectoId: borrador?.procesoProyectoId ?? null, empresaId: borrador ? null : empresa?.id },
    });
    if (!result.ok) {
      sileo.error({ title: "No se pudo registrar el bot", description: result.message });
      return;
    }
    sileo.success({
      title: "Bot registrado",
      description: borrador ? "El proceso pasó a producción y su tarea quedó marcada como hecha." : undefined,
    });
    router.push(`/dashboard/bots/${result.data.id}`);
    router.refresh();
  });

  const cancelar = bot ? `/dashboard/bots/${bot.id}` : borrador?.proyectoId ? `/dashboard/proyectos/${borrador.proyectoId}` : "/dashboard/bots";

  return (
    <form onSubmit={onSubmit} noValidate className={`${CARD} max-w-3xl`}>
      <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <Field id="bot-empresa" label="Cliente" error={empresaError ? "Elige para qué empresa corre el bot." : undefined} className="sm:col-span-2">
          {bot || borrador ? (
            <p className={`${input(false)} flex items-center bg-brand-50 font-medium`}>
              {bot?.empresaNombre ?? borrador?.empresaNombre}
              {borrador?.proyectoNombre && <span className="ml-1 font-normal text-ink-500">· {borrador.proyectoNombre}</span>}
            </p>
          ) : (
            <EmpresaPicker
              id="bot-empresa"
              value={empresa}
              onChange={(e) => {
                setEmpresa(e);
                setEmpresaError(false);
              }}
              hasError={empresaError}
            />
          )}
        </Field>
        <Field id="bot-nombre" label="Nombre" error={errors.nombre?.message} className="sm:col-span-2">
          <input id="bot-nombre" placeholder="Ej. Conciliación bancaria diaria" className={input(!!errors.nombre)} {...register("nombre")} />
        </Field>
        <Field id="bot-servicio" label="Solución">
          <select id="bot-servicio" className={input(false)} {...register("servicio")}>
            {SERVICIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="bot-plataforma" label="Plataforma" optional error={errors.plataforma?.message}>
          <input id="bot-plataforma" list="bot-plataformas" placeholder="Ej. UiPath" className={input(!!errors.plataforma)} {...register("plataforma")} />
          <datalist id="bot-plataformas">
            {PLATAFORMAS_SUGERIDAS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
        <Field id="bot-horario" label="Cuándo corre" optional error={errors.horario?.message} className="sm:col-span-2">
          <input id="bot-horario" placeholder="Ej. Lunes a viernes, 7:00" className={input(!!errors.horario)} {...register("horario")} />
        </Field>
        <Field id="bot-desde" label="En producción desde" error={errors.enProduccionDesde?.message}>
          <input id="bot-desde" type="date" className={input(!!errors.enProduccionDesde)} {...register("enProduccionDesde")} />
        </Field>
        <Field id="bot-responsable" label="Responsable de soporte">
          <select id="bot-responsable" className={input(false)} {...register("responsableId")}>
            <option value="">Sin asignar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </Field>
        {bot && (
          <>
            <Field id="bot-estado" label="Estado">
              <select id="bot-estado" className={input(false)} {...register("estado")}>
                {BOT_ESTADOS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            {estado === "retirado" ? (
              <Field id="bot-retiro" label="Retirado el" optional hint="Vacío: hoy." error={errors.retiradoEl?.message}>
                <input id="bot-retiro" type="date" className={input(!!errors.retiradoEl)} {...register("retiradoEl")} />
              </Field>
            ) : (
              <div className="hidden sm:block" />
            )}
          </>
        )}
        <Field id="bot-descripcion" label="Qué hace" optional error={errors.descripcion?.message} className="sm:col-span-2">
          <textarea id="bot-descripcion" rows={3} className={`${input(!!errors.descripcion)} h-auto resize-y py-2.5`} {...register("descripcion")} />
        </Field>

        <fieldset className="grid gap-4 border-t border-line pt-5 sm:col-span-2 sm:grid-cols-3">
          <legend className="mb-1 text-sm font-semibold text-ink-950">Lo estimado</legend>
          <p className="mb-3 text-xs text-ink-500 sm:col-span-3">
            {borrador?.desdeDiagnostico
              ? "Del diagnóstico del proceso. Es contra lo que se compara el ahorro real de cada mes."
              : "Contra esto se compara el ahorro real de cada mes: los casos que resuelve el bot, por los minutos que tomaban a mano, al costo por hora."}
          </p>
          <Field id="bot-horas" label="Horas liberadas al mes" error={errors.horasMesEstimadas?.message}>
            <input id="bot-horas" type="number" min={0} step="any" className={input(!!errors.horasMesEstimadas)} {...register("horasMesEstimadas", num)} />
          </Field>
          <Field id="bot-costo" label="Costo por hora (S/)" error={errors.costoHora?.message}>
            <input id="bot-costo" type="number" min={0} step="any" className={input(!!errors.costoHora)} {...register("costoHora", num)} />
          </Field>
          <Field id="bot-minutos" label="Minutos por caso a mano" error={errors.minutosPorCaso?.message}>
            <input id="bot-minutos" type="number" min={0} step="any" className={input(!!errors.minutosPorCaso)} {...register("minutosPorCaso", num)} />
          </Field>
          <p className="text-sm text-ink-700 sm:col-span-3">
            Ahorro estimado: <span className="font-semibold text-ink-950">{estimado === null ? "—" : `${formatSoles(estimado)} al mes`}</span>
          </p>
        </fieldset>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <Link href={cancelar} className={BUTTON_SECONDARY}>
          Cancelar
        </Link>
        <button type="submit" disabled={isSubmitting} className={BUTTON_PRIMARY}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {bot ? "Guardar cambios" : "Registrar bot"}
        </button>
      </div>
    </form>
  );
}
