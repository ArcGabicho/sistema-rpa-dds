"use client";

import Link from "next/link";
import { Loader2, LockKeyhole } from "lucide-react";
import { EmpresaPicker, type EmpresaOption } from "@/components/comercial/empresa-picker";
import { ValorInput } from "@/components/boveda/valor-input";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { useSecretoForm } from "@/hooks/use-secreto-form";
import { SECRETO_TIPOS, TIPOS_MULTILINEA, type Secreto } from "@/lib/boveda";

const USUARIO_LABEL: Record<string, string> = {
  credencial: "Usuario",
  conexion: "Usuario de la base",
};

export function SecretoForm({
  secreto,
  empresa,
  esAdmin,
}: {
  secreto?: Secreto;
  empresa?: EmpresaOption;
  esAdmin: boolean;
}) {
  const { register, errors, isSubmitting, setValor, tipo, empresaOption, setEmpresaOption, onSubmit } = useSecretoForm({
    secreto,
    empresa,
  });
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;
  // Only an admin can lift (or set) the restriction on an existing secret.
  const restriccionBloqueada = !!secreto && !esAdmin;

  return (
    <form onSubmit={onSubmit} noValidate className={`${CARD} max-w-3xl`}>
      <fieldset className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <legend className="sr-only">Qué es</legend>
        <Field id="secreto-nombre" label="Nombre" error={errors.nombre?.message} className="sm:col-span-2">
          <input
            id="secreto-nombre"
            placeholder="Ej. SAP producción — usuario del bot de conciliación"
            aria-invalid={errors.nombre ? true : undefined}
            aria-describedby={errors.nombre ? "secreto-nombre-error" : undefined}
            className={input(!!errors.nombre)}
            {...register("nombre")}
          />
        </Field>
        <Field id="secreto-tipo" label="Tipo">
          <select id="secreto-tipo" className={input(false)} {...register("tipo")}>
            {SECRETO_TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="secreto-empresa" label="Empresa" optional hint="Vacío: es una credencial de DDS.">
          <EmpresaPicker id="secreto-empresa" value={empresaOption} onChange={setEmpresaOption} />
        </Field>
        <Field id="secreto-usuario" label={USUARIO_LABEL[tipo] ?? "Usuario o ID"} optional error={errors.usuario?.message}>
          <input id="secreto-usuario" autoComplete="off" className={input(!!errors.usuario)} {...register("usuario")} />
        </Field>
        <Field id="secreto-url" label="Dónde se usa" optional error={errors.url?.message} hint="URL, host o sistema.">
          <input
            id="secreto-url"
            placeholder="Ej. sap.cliente.pe, api.openai.com"
            className={input(!!errors.url)}
            {...register("url")}
          />
        </Field>
      </fieldset>

      {!secreto && (
        <fieldset className="border-t border-line p-6 sm:p-8">
          <legend className="sr-only">El valor</legend>
          <Field
            id="secreto-valor"
            label={tipo === "credencial" ? "Contraseña" : "Valor"}
            error={errors.valor?.message}
            hint="Se guarda cifrado. Para verlo después habrá que revelarlo, y quedará registrado."
          >
            <ValorInput
              id="secreto-valor"
              registration={register("valor")}
              multiline={TIPOS_MULTILINEA.includes(tipo)}
              hasError={!!errors.valor}
              describedBy={errors.valor ? "secreto-valor-error" : undefined}
              onGenerate={setValor}
            />
          </Field>
        </fieldset>
      )}

      <fieldset className="grid gap-5 border-t border-line p-6 sm:grid-cols-2 sm:p-8">
        <legend className="sr-only">Control</legend>
        <Field id="secreto-vence" label="Vence el" optional hint="Para avisar antes de que deje de funcionar.">
          <input id="secreto-vence" type="date" className={input(false)} {...register("venceEl")} />
        </Field>
        <div className="flex items-start gap-3 rounded-md border border-line p-3.5 sm:mt-6">
          <input
            id="secreto-restringido"
            type="checkbox"
            disabled={restriccionBloqueada}
            className="mt-0.5 h-4 w-4 rounded-[4px] border-line accent-brand-700 disabled:opacity-50"
            {...register("restringido")}
          />
          <label htmlFor="secreto-restringido" className="text-sm">
            <span className="flex items-center gap-1.5 font-medium text-ink-950">
              <LockKeyhole className="h-3.5 w-3.5 text-brand-700" />
              Restringida
            </span>
            <span className="mt-0.5 block text-xs text-ink-500">
              {restriccionBloqueada ? "Solo un administrador puede cambiar esto." : "Solo los administradores podrán verla."}
            </span>
          </label>
        </div>
        <Field id="secreto-notas" label="Notas" optional error={errors.notas?.message} className="sm:col-span-2" hint="No pongas aquí nada secreto: las notas no se cifran.">
          <textarea id="secreto-notas" rows={3} className={`${input(!!errors.notas)} h-auto resize-y py-2.5`} {...register("notas")} />
        </Field>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <Link href={secreto ? `/dashboard/boveda/${secreto.id}` : "/dashboard/boveda"} className={BUTTON_SECONDARY}>
          Cancelar
        </Link>
        <button type="submit" disabled={isSubmitting} className={BUTTON_PRIMARY}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {secreto ? "Guardar cambios" : "Guardar en la bóveda"}
        </button>
      </div>
    </form>
  );
}
