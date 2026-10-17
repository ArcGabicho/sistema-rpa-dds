"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { PermisosMatriz } from "@/components/usuarios/permisos-matriz";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { ROLES } from "@/lib/permisos";
import { panelFetch } from "@/lib/panel-api";
import { createUserSchema, type CreateUserValues, type RolPreset, type User } from "@/lib/users-schema";

// A new access with a temporary password. The role sets what they can do
// in each module; it can be adjusted per module afterwards.
export function NuevoUsuarioForm({ roles }: { roles: RolPreset[] }) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: "", email: "", password: "", role: "Consultor" },
  });
  const rol = useWatch({ control, name: "role" });
  const preset = roles.find((r) => r.rol === rol);
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;

  const onSubmit = handleSubmit(async (values) => {
    const result = await panelFetch<User>("users", { method: "POST", body: { ...values, email: values.email.trim(), fullName: values.fullName.trim() } });
    if (!result.ok) {
      sileo.error({ title: "No se pudo crear el usuario", description: result.message });
      return;
    }
    sileo.success({ title: "Usuario creado", description: `${values.fullName} ya puede ingresar con la contraseña temporal.` });
    router.push(`/dashboard/usuarios/${result.data.id}`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className={`${CARD} max-w-3xl`}>
      <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <Field id="nu-nombre" label="Nombre completo" error={errors.fullName?.message} className="sm:col-span-2">
          <input id="nu-nombre" placeholder="María Torres" autoComplete="off" className={input(!!errors.fullName)} {...register("fullName")} />
        </Field>
        <Field id="nu-email" label="Correo" error={errors.email?.message}>
          <input id="nu-email" type="email" placeholder="maria@dds.pe" autoComplete="off" className={input(!!errors.email)} {...register("email")} />
        </Field>
        <Field id="nu-clave" label="Contraseña temporal" error={errors.password?.message} hint="Compártela por un canal seguro; la persona la cambia en Mi cuenta.">
          <input id="nu-clave" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" className={input(!!errors.password)} {...register("password")} />
        </Field>

        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-ink-950">Rol</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${rol === r.value ? "border-brand-700 bg-brand-50" : "border-line hover:bg-brand-50"}`}
              >
                <input type="radio" value={r.value} className="mt-1 accent-brand-700" {...register("role")} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink-950">{r.label}</span>
                  <span className="block text-xs text-ink-500">{r.ayuda}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {preset && (
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-ink-950">Lo que podrá hacer</p>
            <p className="text-xs text-ink-500">Luego puedes ajustar cada módulo desde su ficha.</p>
            <div className="mt-2 rounded-lg border border-line px-4">
              <PermisosMatriz valores={preset.permisos} />
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <Link href="/dashboard/usuarios" className={BUTTON_SECONDARY}>
          Cancelar
        </Link>
        <button type="submit" disabled={isSubmitting} className={BUTTON_PRIMARY}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear usuario
        </button>
      </div>
    </form>
  );
}
