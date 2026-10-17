"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { EmpresaPicker } from "@/components/comercial/empresa-picker";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { useOportunidadForm } from "@/hooks/use-oportunidad-form";
import { ETAPAS, SERVICIOS, fullName, type Empresa, type Oportunidad, type TeamUser } from "@/lib/comercial";
import { UsuarioOptions } from "@/components/ui/usuario-options";

export function OportunidadForm({
  oportunidad,
  empresa,
  users,
  defaultResponsableId,
}: {
  oportunidad?: Oportunidad;
  empresa?: Pick<Empresa, "id" | "nombreComercial" | "ruc" | "contactos">;
  users: TeamUser[];
  defaultResponsableId?: number;
}) {
  const { register, errors, isSubmitting, etapa, empresaOption, pickEmpresa, contactos, onSubmit } =
    useOportunidadForm({ oportunidad, empresa, defaultResponsableId });
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;
  const cancelHref = oportunidad
    ? `/dashboard/oportunidades/${oportunidad.id}`
    : empresa
      ? `/dashboard/empresas/${empresa.id}`
      : "/dashboard/oportunidades";

  return (
    <form onSubmit={onSubmit} noValidate className={`${CARD} max-w-3xl`}>
      <fieldset className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <legend className="sr-only">La oportunidad</legend>
        <Field id="op-empresa" label="Empresa" error={errors.empresaId?.message} className="sm:col-span-2">
          {oportunidad ? (
            <p className={`${input(false)} flex items-center bg-brand-50 font-medium`}>{oportunidad.empresaNombre}</p>
          ) : (
            <EmpresaPicker
              id="op-empresa"
              value={empresaOption}
              onChange={pickEmpresa}
              hasError={!!errors.empresaId}
              describedBy={errors.empresaId ? "op-empresa-error" : undefined}
            />
          )}
        </Field>
        <Field id="op-titulo" label="Qué se quiere resolver" error={errors.titulo?.message} className="sm:col-span-2">
          <input
            id="op-titulo"
            placeholder="Ej. Automatizar la conciliación bancaria diaria"
            aria-invalid={errors.titulo ? true : undefined}
            aria-describedby={errors.titulo ? "op-titulo-error" : undefined}
            className={input(!!errors.titulo)}
            {...register("titulo")}
          />
        </Field>
        <Field id="op-servicio" label="Servicio">
          <select id="op-servicio" className={input(false)} {...register("servicio")}>
            {SERVICIOS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="op-contacto" label="Contacto" optional>
          <select id="op-contacto" disabled={!empresaOption} className={input(false)} {...register("contactoId")}>
            <option value="">{contactos.length === 0 ? "Sin contactos registrados" : "Sin contacto"}</option>
            {contactos.map((contacto) => (
              <option key={contacto.id} value={contacto.id}>
                {fullName(contacto)}
                {contacto.cargo ? ` · ${contacto.cargo}` : ""}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-line p-6 sm:grid-cols-3 sm:p-8">
        <legend className="sr-only">Etapa y valor</legend>
        <Field id="op-etapa" label="Etapa">
          <select id="op-etapa" className={input(false)} {...register("etapa")}>
            {ETAPAS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="op-valor" label="Valor estimado (S/)" optional error={errors.valorEstimado?.message}>
          <input
            id="op-valor"
            inputMode="decimal"
            placeholder="0"
            aria-invalid={errors.valorEstimado ? true : undefined}
            aria-describedby={errors.valorEstimado ? "op-valor-error" : undefined}
            className={input(!!errors.valorEstimado)}
            {...register("valorEstimado")}
          />
        </Field>
        <Field id="op-cierre" label="Cierre estimado" optional>
          <input id="op-cierre" type="date" className={input(false)} {...register("fechaCierreEstimada")} />
        </Field>
        {etapa === "perdida" && (
          <Field id="op-motivo" label="Motivo de la pérdida" error={errors.motivoPerdida?.message} className="sm:col-span-3">
            <input
              id="op-motivo"
              placeholder="Ej. Eligió otro proveedor, sin presupuesto este año"
              aria-invalid={errors.motivoPerdida ? true : undefined}
              aria-describedby={errors.motivoPerdida ? "op-motivo-error" : undefined}
              className={input(!!errors.motivoPerdida)}
              {...register("motivoPerdida")}
            />
          </Field>
        )}
      </fieldset>

      <fieldset className="grid gap-5 border-t border-line p-6 sm:grid-cols-[minmax(0,1fr)_11rem] sm:p-8">
        <legend className="sr-only">Seguimiento</legend>
        <Field id="op-accion" label="Próxima acción" optional hint="El siguiente paso concreto, para que nada se enfríe.">
          <input
            id="op-accion"
            placeholder="Ej. Llamar para agendar el diagnóstico"
            className={input(!!errors.proximaAccion)}
            {...register("proximaAccion")}
          />
        </Field>
        <Field id="op-accion-fecha" label="Para el" error={errors.proximaAccionFecha?.message}>
          <input
            id="op-accion-fecha"
            type="date"
            aria-invalid={errors.proximaAccionFecha ? true : undefined}
            aria-describedby={errors.proximaAccionFecha ? "op-accion-fecha-error" : undefined}
            className={input(!!errors.proximaAccionFecha)}
            {...register("proximaAccionFecha")}
          />
        </Field>
        <Field id="op-responsable" label="Responsable" className="sm:col-span-2 sm:max-w-sm">
          <select id="op-responsable" className={input(false)} {...register("responsableId")}>
            <option value="">Sin asignar</option>
            <UsuarioOptions users={users} actual={oportunidad?.responsableId} />
          </select>
        </Field>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <Link href={cancelHref} className={BUTTON_SECONDARY}>
          Cancelar
        </Link>
        <button type="submit" disabled={isSubmitting} className={BUTTON_PRIMARY}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {oportunidad ? "Guardar cambios" : "Crear oportunidad"}
        </button>
      </div>
    </form>
  );
}
