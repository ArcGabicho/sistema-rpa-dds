"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import type { TeamUser } from "@/lib/comercial";
import { PROYECTO_ESTADOS, type Proyecto } from "@/lib/proyecto";
import { panelFetch } from "@/lib/panel-api";
import { UsuarioOptions } from "@/components/ui/usuario-options";

const schema = z
  .object({
    nombre: z.string().trim().min(3, "Mínimo 3 caracteres.").max(200),
    descripcion: z.string().trim().max(2000),
    estado: z.enum(["planificado", "en_curso", "en_pausa", "completado", "cancelado"]),
    fechaInicio: z.string().min(1, "Elige la fecha de inicio."),
    fechaFinPlan: z.string().min(1, "Elige la fecha de fin."),
    responsableId: z.string(),
  })
  .refine((v) => v.fechaFinPlan >= v.fechaInicio, { path: ["fechaFinPlan"], message: "No puede ser antes del inicio." });
type Values = z.infer<typeof schema>;

export function ProyectoAjustes({ proyecto, users }: { proyecto: Proyecto; users: TeamUser[] }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion ?? "",
      estado: proyecto.estado as Values["estado"],
      fechaInicio: proyecto.fechaInicio.slice(0, 10),
      fechaFinPlan: proyecto.fechaFinPlan.slice(0, 10),
      responsableId: proyecto.responsableId?.toString() ?? "",
    },
  });
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;

  const onSubmit = handleSubmit(async (v) => {
    const result = await panelFetch(`proyectos/${proyecto.id}`, {
      method: "PUT",
      body: {
        nombre: v.nombre.trim(),
        descripcion: v.descripcion.trim() || null,
        estado: v.estado,
        fechaInicio: v.fechaInicio,
        fechaFinPlan: v.fechaFinPlan,
        responsableId: v.responsableId ? Number(v.responsableId) : null,
      },
    });
    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar el proyecto", description: result.message });
      return;
    }
    sileo.success({ title: "Proyecto actualizado" });
    reset(v);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className={`${CARD} flex flex-col gap-4 p-5`}>
      <h2 className="text-base font-semibold text-ink-950">Ajustes</h2>
      <Field id="py-nombre" label="Nombre" error={errors.nombre?.message}>
        <input id="py-nombre" className={input(!!errors.nombre)} {...register("nombre")} />
      </Field>
      <Field id="py-estado" label="Estado">
        <select id="py-estado" className={input(false)} {...register("estado")}>
          {PROYECTO_ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="py-inicio" label="Inicio" error={errors.fechaInicio?.message}>
          <input id="py-inicio" type="date" className={input(!!errors.fechaInicio)} {...register("fechaInicio")} />
        </Field>
        <Field id="py-fin" label="Fin planificado" error={errors.fechaFinPlan?.message}>
          <input id="py-fin" type="date" className={input(!!errors.fechaFinPlan)} {...register("fechaFinPlan")} />
        </Field>
      </div>
      <Field id="py-responsable" label="Jefe de proyecto">
        <select id="py-responsable" className={input(false)} {...register("responsableId")}>
          <option value="">Sin asignar</option>
          <UsuarioOptions users={users} actual={proyecto.responsableId} />
        </select>
      </Field>
      <Field id="py-descripcion" label="Descripción" optional error={errors.descripcion?.message}>
        <textarea id="py-descripcion" rows={3} className={`${input(!!errors.descripcion)} h-auto resize-y py-2.5`} {...register("descripcion")} />
      </Field>
      <button type="submit" disabled={isSubmitting || !isDirty} className={BUTTON_PRIMARY}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar
      </button>
    </form>
  );
}
