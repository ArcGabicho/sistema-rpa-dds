"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { sileo } from "sileo";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { fullName, type Contacto } from "@/lib/comercial";
import { contactoSchema, orNull, type ContactoValues } from "@/lib/comercial-schema";
import { panelFetch } from "@/lib/panel-api";

function ContactoForm({
  empresaId,
  contacto,
  onDone,
}: {
  empresaId: number;
  contacto?: Contacto;
  onDone: () => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactoValues>({
    resolver: zodResolver(contactoSchema),
    defaultValues: {
      nombres: contacto?.nombres ?? "",
      apellidos: contacto?.apellidos ?? "",
      cargo: contacto?.cargo ?? "",
      email: contacto?.email ?? "",
      telefono: contacto?.telefono ?? "",
    },
  });
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;
  const prefix = `contacto-${contacto?.id ?? "nuevo"}`;

  const onSubmit = handleSubmit(async (values) => {
    const body = {
      nombres: values.nombres.trim(),
      apellidos: orNull(values.apellidos),
      cargo: orNull(values.cargo),
      email: orNull(values.email),
      telefono: orNull(values.telefono),
    };
    const result = contacto
      ? await panelFetch(`contactos/${contacto.id}`, { method: "PUT", body })
      : await panelFetch(`empresas/${empresaId}/contactos`, { method: "POST", body });

    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar el contacto", description: result.message });
      return;
    }
    onDone();
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 bg-brand-50 p-5 sm:grid-cols-2">
      <Field id={`${prefix}-nombres`} label="Nombres" error={errors.nombres?.message}>
        <input
          id={`${prefix}-nombres`}
          autoFocus
          aria-invalid={errors.nombres ? true : undefined}
          className={input(!!errors.nombres)}
          {...register("nombres")}
        />
      </Field>
      <Field id={`${prefix}-apellidos`} label="Apellidos" optional>
        <input id={`${prefix}-apellidos`} className={input(false)} {...register("apellidos")} />
      </Field>
      <Field id={`${prefix}-cargo`} label="Cargo" optional className="sm:col-span-2">
        <input
          id={`${prefix}-cargo`}
          placeholder="Ej. Jefe de Finanzas"
          className={input(false)}
          {...register("cargo")}
        />
      </Field>
      <Field id={`${prefix}-email`} label="Correo" optional error={errors.email?.message}>
        <input
          id={`${prefix}-email`}
          type="email"
          aria-invalid={errors.email ? true : undefined}
          className={input(!!errors.email)}
          {...register("email")}
        />
      </Field>
      <Field id={`${prefix}-telefono`} label="Teléfono" optional>
        <input id={`${prefix}-telefono`} type="tel" className={input(false)} {...register("telefono")} />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={onDone} className={BUTTON_SECONDARY}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={BUTTON_PRIMARY}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {contacto ? "Guardar" : "Agregar"}
        </button>
      </div>
    </form>
  );
}

// The people DDS talks to at a company.
export function ContactosPanel({ empresaId, contactos }: { empresaId: number; contactos: Contacto[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | "nuevo" | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function remove(contacto: Contacto) {
    if (!window.confirm(`¿Eliminar a ${fullName(contacto)}? Sus oportunidades quedarán sin contacto.`)) return;
    setDeleting(contacto.id);
    const result = await panelFetch(`contactos/${contacto.id}`, { method: "DELETE" });
    setDeleting(null);
    if (!result.ok) {
      sileo.error({ title: "No se pudo eliminar el contacto", description: result.message });
      return;
    }
    router.refresh();
  }

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex items-center justify-between gap-4 p-5">
        <h2 className="text-base font-semibold text-ink-950">
          Contactos <span className="font-normal text-ink-500">{contactos.length}</span>
        </h2>
        {editing !== "nuevo" && (
          <button type="button" onClick={() => setEditing("nuevo")} className={`${BUTTON_SECONDARY} h-9 px-3`}>
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        )}
      </div>

      {editing === "nuevo" && (
        <div className="border-t border-line">
          <ContactoForm empresaId={empresaId} onDone={() => setEditing(null)} />
        </div>
      )}

      {contactos.length === 0 && editing !== "nuevo" ? (
        <p className="border-t border-line px-5 py-4 text-sm text-ink-500">Aún no hay contactos registrados.</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {contactos.map((contacto) =>
            editing === contacto.id ? (
              <li key={contacto.id}>
                <ContactoForm empresaId={empresaId} contacto={contacto} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={contacto.id} className="group flex items-start justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-ink-950">{fullName(contacto)}</p>
                  {contacto.cargo && <p className="text-xs text-ink-500">{contacto.cargo}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                    {contacto.email && (
                      <a href={`mailto:${contacto.email}`} className="inline-flex items-center gap-1 hover:text-ink-950">
                        <Mail className="h-3.5 w-3.5" />
                        {contacto.email}
                      </a>
                    )}
                    {contacto.telefono && (
                      <a href={`tel:${contacto.telefono}`} className="inline-flex items-center gap-1 hover:text-ink-950">
                        <Phone className="h-3.5 w-3.5" />
                        {contacto.telefono}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setEditing(contacto.id)}
                    aria-label={`Editar a ${fullName(contacto)}`}
                    className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-brand-50 hover:text-ink-950"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={deleting === contacto.id}
                    onClick={() => remove(contacto)}
                    aria-label={`Eliminar a ${fullName(contacto)}`}
                    className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
