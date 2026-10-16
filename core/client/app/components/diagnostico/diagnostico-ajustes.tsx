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
import { DIAGNOSTICO_ESTADOS, type Diagnostico } from "@/lib/diagnostico";
import { panelFetch } from "@/lib/panel-api";

const schema = z.object({
  titulo: z.string().trim().min(3, "Mínimo 3 caracteres.").max(200),
  estado: z.enum(["en_curso", "entregado", "archivado"]),
  costoHora: z.number({ message: "Ingresa el costo por hora." }).min(0, "No puede ser negativo.").max(10_000),
  resumen: z.string().trim().max(4000, "Máximo 4000 caracteres."),
  responsableId: z.string(),
});
type Values = z.infer<typeof schema>;

// The diagnosis's own settings: title, status, the client's hourly cost
// (every process's savings depend on it) and the summary for the report.
export function DiagnosticoAjustes({ diagnostico, users }: { diagnostico: Diagnostico; users: TeamUser[] }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: diagnostico.titulo,
      estado: diagnostico.estado as Values["estado"],
      costoHora: diagnostico.costoHora,
      resumen: diagnostico.resumen ?? "",
      responsableId: diagnostico.responsableId?.toString() ?? "",
    },
  });
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;

  const onSubmit = handleSubmit(async (values) => {
    const result = await panelFetch(`diagnosticos/${diagnostico.id}`, {
      method: "PUT",
      body: {
        titulo: values.titulo.trim(),
        estado: values.estado,
        costoHora: values.costoHora,
        resumen: values.resumen.trim() || null,
        responsableId: values.responsableId ? Number(values.responsableId) : null,
      },
    });
    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar", description: result.message });
      return;
    }
    sileo.success({
      title: values.estado === "entregado" && diagnostico.estado !== "entregado" ? "Diagnóstico entregado" : "Diagnóstico actualizado",
      description:
        values.estado === "entregado" && diagnostico.estado !== "entregado" && diagnostico.oportunidadId
          ? "Quedó anotado en la oportunidad."
          : undefined,
    });
    reset(values);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className={`${CARD} flex flex-col gap-4 p-5`}>
      <h2 className="text-base font-semibold text-ink-950">Ajustes</h2>
      <Field id="diag-titulo" label="Título" error={errors.titulo?.message}>
        <input id="diag-titulo" className={input(!!errors.titulo)} {...register("titulo")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="diag-estado" label="Estado">
          <select id="diag-estado" className={input(false)} {...register("estado")}>
            {DIAGNOSTICO_ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="diag-costo-hora" label="Costo por hora (S/)" error={errors.costoHora?.message}>
          <input id="diag-costo-hora" type="number" min={0} step="any" className={input(!!errors.costoHora)} {...register("costoHora", { valueAsNumber: true })} />
        </Field>
      </div>
      <Field id="diag-responsable" label="Responsable">
        <select id="diag-responsable" className={input(false)} {...register("responsableId")}>
          <option value="">Sin asignar</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>
      </Field>
      <Field id="diag-resumen" label="Resumen ejecutivo" optional error={errors.resumen?.message} hint="Encabeza el informe para el cliente.">
        <textarea id="diag-resumen" rows={4} className={`${input(!!errors.resumen)} h-auto resize-y py-2.5`} {...register("resumen")} />
      </Field>
      <button type="submit" disabled={isSubmitting || !isDirty} className={BUTTON_PRIMARY}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar
      </button>
    </form>
  );
}
