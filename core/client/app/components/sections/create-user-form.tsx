"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ROLE_OPTIONS } from "@/lib/users-schema";
import { useCreateUser } from "@/hooks/use-create-user";

const FIELD_BASE =
  "mt-1.5 h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400";

function fieldState(hasError: boolean) {
  return hasError
    ? "border-red-400 focus:border-red-500"
    : "border-neutral-200 focus:border-neutral-950";
}

export function CreateUserForm() {
  const { register, errors, isSubmitting, onSubmit } = useCreateUser();

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-lg">
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="user-full-name" className="text-sm font-medium text-neutral-950">
            Nombre completo
          </label>
          <input
            id="user-full-name"
            type="text"
            placeholder="María Torres"
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={errors.fullName ? "user-full-name-error" : undefined}
            className={`${FIELD_BASE} ${fieldState(!!errors.fullName)}`}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p id="user-full-name-error" className="mt-1.5 text-xs text-red-500">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="user-email" className="text-sm font-medium text-neutral-950">
            Correo electrónico
          </label>
          <input
            id="user-email"
            type="email"
            placeholder="maria@dds.pe"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "user-email-error" : undefined}
            className={`${FIELD_BASE} ${fieldState(!!errors.email)}`}
            {...register("email")}
          />
          {errors.email && (
            <p id="user-email-error" className="mt-1.5 text-xs text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="user-password" className="text-sm font-medium text-neutral-950">
            Contraseña temporal
          </label>
          <input
            id="user-password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "user-password-error" : undefined}
            className={`${FIELD_BASE} ${fieldState(!!errors.password)}`}
            {...register("password")}
          />
          {errors.password && (
            <p id="user-password-error" className="mt-1.5 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="user-role" className="text-sm font-medium text-neutral-950">
            Rol
          </label>
          <select
            id="user-role"
            aria-invalid={errors.role ? true : undefined}
            aria-describedby={errors.role ? "user-role-error" : undefined}
            className={`${FIELD_BASE} px-3 ${fieldState(!!errors.role)}`}
            {...register("role")}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p id="user-role-error" className="mt-1.5 text-xs text-red-500">
              {errors.role.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/usuarios"
          className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 px-6 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creando..." : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}
