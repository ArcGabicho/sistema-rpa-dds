"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { EmpresaPicker, type EmpresaOption } from "@/components/comercial/empresa-picker";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import type { TeamUser } from "@/lib/comercial";
import { panelFetch } from "@/lib/panel-api";
import { UsuarioOptions } from "@/components/ui/usuario-options";

const schema = z.object({
  titulo: z.string().trim().min(3, "Ponle un título (mínimo 3 caracteres).").max(200),
  costoHora: z.number({ message: "Ingresa el costo por hora." }).min(0, "No puede ser negativo.").max(10_000),
  responsableId: z.string(),
});
type Values = z.infer<typeof schema>;

// Start a diagnosis: from an opportunity (company fixed, and the
// opportunity moves to "diagnóstico") or for any company.
export function NuevoDiagnosticoForm({
  oportunidad,
  empresa,
  users,
  defaultResponsableId,
}: {
  oportunidad?: { id: number; titulo: string; empresaId: number; empresaNombre: string };
  empresa?: EmpresaOption;
  users: TeamUser[];
  defaultResponsableId?: number;
}) {
  const router = useRouter();
  const [empresaOption, setEmpresaOption] = useState<EmpresaOption | null>(empresa ?? null);
  const [empresaError, setEmpresaError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: "Diagnóstico de procesos",
      costoHora: 30,
      responsableId: defaultResponsableId?.toString() ?? "",
    },
  });
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;

  const onSubmit = handleSubmit(async (values) => {
    if (!oportunidad && !empresaOption) {
      setEmpresaError(true);
      return;
    }
    const result = await panelFetch<{ id: number }>("diagnosticos", {
      method: "POST",
      body: {
        oportunidadId: oportunidad?.id ?? null,
        empresaId: oportunidad?.empresaId ?? empresaOption?.id ?? null,
        titulo: values.titulo.trim(),
        costoHora: values.costoHora,
        responsableId: values.responsableId ? Number(values.responsableId) : null,
      },
    });
    if (!result.ok) {
      sileo.error({ title: "No se pudo crear el diagnóstico", description: result.message });
      return;
    }
    sileo.success({ title: "Diagnóstico creado", description: "Agrega los procesos que levantaste con el cliente." });
    router.push(`/dashboard/diagnosticos/${result.data.id}`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className={`${CARD} max-w-2xl`}>
      <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <Field id="nd-empresa" label="Empresa" error={empresaError ? "Elige la empresa." : undefined} className="sm:col-span-2">
          {oportunidad ? (
            <p className={`${input(false)} flex items-center bg-brand-50 font-medium`}>
              {oportunidad.empresaNombre} · {oportunidad.titulo}
            </p>
          ) : (
            <EmpresaPicker
              id="nd-empresa"
              value={empresaOption}
              onChange={(o) => {
                setEmpresaOption(o);
                setEmpresaError(false);
              }}
              hasError={empresaError}
            />
          )}
        </Field>
        <Field id="nd-titulo" label="Título" error={errors.titulo?.message} className="sm:col-span-2">
          <input id="nd-titulo" className={input(!!errors.titulo)} {...register("titulo")} />
        </Field>
        <Field
          id="nd-costo-hora"
          label="Costo por hora del personal (S/)"
          error={errors.costoHora?.message}
          hint="Sueldo más cargas, por hora. Se puede ajustar por proceso."
        >
          <input id="nd-costo-hora" type="number" min={0} step="any" className={input(!!errors.costoHora)} {...register("costoHora", { valueAsNumber: true })} />
        </Field>
        <Field id="nd-responsable" label="Responsable">
          <select id="nd-responsable" className={input(false)} {...register("responsableId")}>
            <option value="">Sin asignar</option>
            <UsuarioOptions users={users} />
          </select>
        </Field>
        {oportunidad && (
          <p className="text-xs text-ink-500 sm:col-span-2">
            Si la oportunidad aún no está en la etapa Diagnóstico, pasará a ella, y quedará anotado en su historial.
          </p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <Link href={oportunidad ? `/dashboard/oportunidades/${oportunidad.id}` : "/dashboard/diagnosticos"} className={BUTTON_SECONDARY}>
          Cancelar
        </Link>
        <button type="submit" disabled={isSubmitting} className={BUTTON_PRIMARY}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear diagnóstico
        </button>
      </div>
    </form>
  );
}
