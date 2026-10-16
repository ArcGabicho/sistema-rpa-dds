"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, RefreshCw } from "lucide-react";
import { sileo } from "sileo";
import { ValorInput } from "@/components/boveda/valor-input";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { TIPOS_MULTILINEA } from "@/lib/boveda";
import { panelFetch } from "@/lib/panel-api";

const schema = z.object({
  valor: z.string().min(1, "Ingresa el valor nuevo.").max(10_000, "Máximo 10 000 caracteres."),
  venceEl: z.string(),
});
type Values = z.infer<typeof schema>;

// Replaces the value after a password change or a new key. The old value is
// gone for good, so the form says so.
export function RotarSecreto({
  id,
  tipo,
  venceEl,
  bloqueado,
}: {
  id: number;
  tipo: string;
  venceEl: string | null;
  bloqueado: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { valor: "", venceEl: venceEl?.slice(0, 10) ?? "" } });

  const onSubmit = handleSubmit(async (values) => {
    const result = await panelFetch(`boveda/${id}/valor`, {
      method: "PUT",
      body: { valor: values.valor, venceEl: values.venceEl || null },
    });
    if (!result.ok) {
      sileo.error({ title: "No se pudo rotar el valor", description: result.message });
      return;
    }
    sileo.success({ title: "Valor actualizado", description: "El anterior ya no se puede recuperar." });
    reset({ valor: "", venceEl: values.venceEl });
    setAbierto(false);
    router.refresh();
  });

  if (bloqueado) return null;

  return (
    <section className={`${CARD} p-6`}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-ink-950">Rotar valor</h2>
        {!abierto && (
          <button type="button" onClick={() => setAbierto(true)} className={`${BUTTON_SECONDARY} h-9 px-3`}>
            <RefreshCw className="h-4 w-4" />
            Rotar
          </button>
        )}
      </div>
      {!abierto ? (
        <p className="mt-1.5 text-sm text-ink-500">Cuando cambie la contraseña o se emita una llave nueva.</p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-4">
          <Field id="rotar-valor" label="Valor nuevo" error={errors.valor?.message}>
            <ValorInput
              id="rotar-valor"
              registration={register("valor")}
              multiline={TIPOS_MULTILINEA.includes(tipo)}
              hasError={!!errors.valor}
              describedBy={errors.valor ? "rotar-valor-error" : undefined}
              onGenerate={(valor) => setValue("valor", valor, { shouldValidate: true })}
            />
          </Field>
          <Field id="rotar-vence" label="Vence el" optional hint="Déjalo vacío si el valor nuevo no vence.">
            <input id="rotar-vence" type="date" className={`${INPUT_BASE} ${inputState(false)}`} {...register("venceEl")} />
          </Field>
          <p className="text-xs text-ink-500">El valor anterior se reemplaza y no se podrá recuperar.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAbierto(false)} className={BUTTON_SECONDARY}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className={BUTTON_PRIMARY}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar valor nuevo
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
