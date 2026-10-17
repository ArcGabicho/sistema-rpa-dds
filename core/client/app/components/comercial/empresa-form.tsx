"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { useEmpresaForm } from "@/hooks/use-empresa-form";
import { EMPRESA_ESTADOS, type Empresa, type TeamUser } from "@/lib/comercial";
import { UsuarioOptions } from "@/components/ui/usuario-options";

export function EmpresaForm({ empresa, users }: { empresa?: Empresa; users: TeamUser[] }) {
  const { register, errors, isSubmitting, onSubmit } = useEmpresaForm(empresa);
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;
  const describedBy = (name: keyof typeof errors) => (errors[name] ? `empresa-${name}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className={`${CARD} max-w-3xl`}>
      <fieldset className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <legend className="sr-only">Datos de la empresa</legend>
        <Field id="empresa-nombreComercial" label="Nombre comercial" error={errors.nombreComercial?.message} className="sm:col-span-2">
          <input
            id="empresa-nombreComercial"
            placeholder="Ej. Ferretería Los Andes"
            aria-invalid={errors.nombreComercial ? true : undefined}
            aria-describedby={describedBy("nombreComercial")}
            className={input(!!errors.nombreComercial)}
            {...register("nombreComercial")}
          />
        </Field>
        <Field id="empresa-razonSocial" label="Razón social" optional error={errors.razonSocial?.message}>
          <input
            id="empresa-razonSocial"
            placeholder="Ej. Ferretería Los Andes S.A.C."
            aria-describedby={describedBy("razonSocial")}
            className={input(!!errors.razonSocial)}
            {...register("razonSocial")}
          />
        </Field>
        <Field id="empresa-ruc" label="RUC" optional error={errors.ruc?.message}>
          <input
            id="empresa-ruc"
            inputMode="numeric"
            maxLength={11}
            placeholder="20xxxxxxxxx"
            aria-invalid={errors.ruc ? true : undefined}
            aria-describedby={describedBy("ruc")}
            className={`${input(!!errors.ruc)} font-mono`}
            {...register("ruc")}
          />
        </Field>
        <Field id="empresa-rubro" label="Rubro" optional error={errors.rubro?.message}>
          <input id="empresa-rubro" placeholder="Ej. Minería, Retail" className={input(!!errors.rubro)} {...register("rubro")} />
        </Field>
        <Field id="empresa-sitioWeb" label="Sitio web" optional error={errors.sitioWeb?.message}>
          <input id="empresa-sitioWeb" placeholder="www.empresa.pe" className={input(!!errors.sitioWeb)} {...register("sitioWeb")} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-line p-6 sm:grid-cols-2 sm:p-8">
        <legend className="sr-only">Ubicación</legend>
        <Field id="empresa-direccion" label="Dirección" optional error={errors.direccion?.message} className="sm:col-span-2">
          <input id="empresa-direccion" className={input(!!errors.direccion)} {...register("direccion")} />
        </Field>
        <Field id="empresa-distrito" label="Distrito" optional error={errors.distrito?.message}>
          <input id="empresa-distrito" className={input(!!errors.distrito)} {...register("distrito")} />
        </Field>
        <Field id="empresa-provincia" label="Provincia" optional error={errors.provincia?.message}>
          <input id="empresa-provincia" className={input(!!errors.provincia)} {...register("provincia")} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-line p-6 sm:grid-cols-3 sm:p-8">
        <legend className="sr-only">Seguimiento</legend>
        <Field id="empresa-estado" label="Estado">
          <select id="empresa-estado" className={input(false)} {...register("estado")}>
            {EMPRESA_ESTADOS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="empresa-responsableId" label="Responsable">
          <select id="empresa-responsableId" className={input(false)} {...register("responsableId")}>
            <option value="">Sin asignar</option>
            <UsuarioOptions users={users} actual={empresa?.responsableId} />
          </select>
        </Field>
        <Field id="empresa-origen" label="Origen" optional error={errors.origen?.message} hint="Feria, referido, web…">
          <input id="empresa-origen" className={input(!!errors.origen)} {...register("origen")} />
        </Field>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <Link href={empresa ? `/dashboard/empresas/${empresa.id}` : "/dashboard/empresas"} className={BUTTON_SECONDARY}>
          Cancelar
        </Link>
        <button type="submit" disabled={isSubmitting} className={BUTTON_PRIMARY}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {empresa ? "Guardar cambios" : "Crear empresa"}
        </button>
      </div>
    </form>
  );
}
