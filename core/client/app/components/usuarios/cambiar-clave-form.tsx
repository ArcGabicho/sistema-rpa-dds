"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { panelFetch } from "@/lib/panel-api";
import { cambiarClaveSchema, type CambiarClaveValues } from "@/lib/users-schema";

// Changing one's own password; the current one is required.
export function CambiarClaveForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CambiarClaveValues>({ resolver: zodResolver(cambiarClaveSchema), defaultValues: { actual: "", nueva: "", confirmar: "" } });
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;

  const onSubmit = handleSubmit(async (v) => {
    const result = await panelFetch("auth/clave", { method: "POST", body: { actual: v.actual, nueva: v.nueva } });
    if (!result.ok) {
      sileo.error({ title: "No se pudo cambiar la contraseña", description: result.message });
      return;
    }
    reset();
    sileo.success({ title: "Contraseña cambiada", description: "Úsala la próxima vez que ingreses." });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field id="cc-actual" label="Contraseña actual" error={errors.actual?.message}>
        <input id="cc-actual" type="password" autoComplete="current-password" className={input(!!errors.actual)} {...register("actual")} />
      </Field>
      <Field id="cc-nueva" label="Nueva contraseña" error={errors.nueva?.message} hint="Mínimo 8 caracteres.">
        <input id="cc-nueva" type="password" autoComplete="new-password" className={input(!!errors.nueva)} {...register("nueva")} />
      </Field>
      <Field id="cc-confirmar" label="Repite la nueva contraseña" error={errors.confirmar?.message}>
        <input id="cc-confirmar" type="password" autoComplete="new-password" className={input(!!errors.confirmar)} {...register("confirmar")} />
      </Field>
      <button type="submit" disabled={isSubmitting} className={`${BUTTON_PRIMARY} self-start`}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Cambiar contraseña
      </button>
    </form>
  );
}
