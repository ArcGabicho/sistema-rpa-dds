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
import type { TeamUser } from "@/lib/comercial";
import { CANALES, SEVERIDADES, SLA_OBJETIVOS, duracion, type BotItem } from "@/lib/operacion";
import { incidenciaSchema, type IncidenciaValues } from "@/lib/operacion-schema";
import { panelFetch } from "@/lib/panel-api";

// Reports an incident on a bot (its company comes with it) or on a company
// without one. The severity sets its SLA, shown as it's chosen.
export function IncidenciaForm({ bots, botId, users, defaultResponsableId }: { bots: BotItem[]; botId?: number; users: TeamUser[]; defaultResponsableId?: number }) {
  const router = useRouter();
  const [destino, setDestino] = useState(botId ? `bot:${botId}` : "");
  const [empresa, setEmpresa] = useState<EmpresaOption | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<IncidenciaValues>({
    resolver: zodResolver(incidenciaSchema),
    defaultValues: {
      destino: botId ? `bot:${botId}` : "",
      titulo: "",
      descripcion: "",
      severidad: "media",
      canal: "correo",
      reportadoPor: "",
      responsableId: defaultResponsableId?.toString() ?? "",
    },
  });
  const severidad = useWatch({ control, name: "severidad" });
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;

  const porEmpresa = new Map<string, BotItem[]>();
  for (const b of bots) porEmpresa.set(b.empresaNombre, [...(porEmpresa.get(b.empresaNombre) ?? []), b]);

  function elegir(valor: string, nuevaEmpresa: EmpresaOption | null = empresa) {
    setDestino(valor);
    const real = valor === "otra" ? (nuevaEmpresa ? `empresa:${nuevaEmpresa.id}` : "") : valor;
    setValue("destino", real, { shouldValidate: isSubmitted });
  }

  const onSubmit = handleSubmit(async (v) => {
    const [tipo, id] = v.destino.split(":");
    const result = await panelFetch<{ id: number; codigo: string }>("incidencias", {
      method: "POST",
      body: {
        botId: tipo === "bot" ? Number(id) : null,
        empresaId: tipo === "empresa" ? Number(id) : null,
        titulo: v.titulo.trim(),
        descripcion: v.descripcion.trim() || null,
        severidad: v.severidad,
        canal: v.canal,
        reportadoPor: v.reportadoPor.trim() || null,
        responsableId: v.responsableId ? Number(v.responsableId) : null,
      },
    });
    if (!result.ok) {
      sileo.error({ title: "No se pudo registrar la incidencia", description: result.message });
      return;
    }
    sileo.success({ title: `Incidencia ${result.data.codigo} registrada` });
    router.push(`/dashboard/incidencias/${result.data.id}`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className={`${CARD} max-w-3xl`}>
      <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <Field id="inc-destino" label="Bot" error={errors.destino?.message} className="sm:col-span-2">
          <select id="inc-destino" value={destino} onChange={(e) => elegir(e.target.value)} className={input(!!errors.destino)}>
            <option value="" disabled>
              Elige el bot
            </option>
            {[...porEmpresa].map(([nombre, lista]) => (
              <optgroup key={nombre} label={nombre}>
                {lista.map((b) => (
                  <option key={b.id} value={`bot:${b.id}`}>
                    {b.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value="otra">Otra consulta del cliente, sin bot</option>
          </select>
        </Field>
        {destino === "otra" && (
          <Field id="inc-empresa" label="Empresa" className="sm:col-span-2">
            <EmpresaPicker
              id="inc-empresa"
              value={empresa}
              onChange={(e) => {
                setEmpresa(e);
                elegir("otra", e);
              }}
            />
          </Field>
        )}
        <Field id="inc-titulo" label="Qué pasa" error={errors.titulo?.message} className="sm:col-span-2">
          <input id="inc-titulo" placeholder="Ej. El bot no puede iniciar sesión en el portal del banco" className={input(!!errors.titulo)} {...register("titulo")} />
        </Field>
        <Field id="inc-descripcion" label="Detalle" optional error={errors.descripcion?.message} className="sm:col-span-2">
          <textarea
            id="inc-descripcion"
            rows={4}
            placeholder="Desde cuándo, qué mensaje aparece, qué casos se afectaron."
            className={`${input(!!errors.descripcion)} h-auto resize-y py-2.5`}
            {...register("descripcion")}
          />
        </Field>

        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-ink-950">Severidad</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SEVERIDADES.map((s) => {
              const sla = SLA_OBJETIVOS[s.value]!;
              const activa = severidad === s.value;
              return (
                <label
                  key={s.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${activa ? "border-brand-700 bg-brand-50" : "border-line hover:bg-brand-50"}`}
                >
                  <input type="radio" value={s.value} className="mt-1 accent-brand-700" {...register("severidad")} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink-950">{s.label}</span>
                    <span className="block text-xs text-ink-500">{s.ayuda}</span>
                    <span className="mt-1 block text-xs text-ink-700">
                      Respuesta en {duracion(sla.respuesta)} · resolución en {duracion(sla.resolucion)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Field id="inc-canal" label="Cómo llegó">
          <select id="inc-canal" className={input(false)} {...register("canal")}>
            {CANALES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="inc-reporta" label="Quién la reportó" optional error={errors.reportadoPor?.message}>
          <input id="inc-reporta" placeholder="Nombre de la persona del cliente" className={input(!!errors.reportadoPor)} {...register("reportadoPor")} />
        </Field>
        <Field id="inc-responsable" label="Responsable">
          <select id="inc-responsable" className={input(false)} {...register("responsableId")}>
            <option value="">Sin asignar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <Link href={botId ? `/dashboard/bots/${botId}` : "/dashboard/incidencias"} className={BUTTON_SECONDARY}>
          Cancelar
        </Link>
        <button type="submit" disabled={isSubmitting} className={BUTTON_PRIMARY}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar incidencia
        </button>
      </div>
    </form>
  );
}
