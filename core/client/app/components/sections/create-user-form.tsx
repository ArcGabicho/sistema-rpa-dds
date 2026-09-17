"use client";

import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { ROLE_OPTIONS } from "@/lib/users-schema";
import { useCreateUser } from "@/hooks/use-create-user";

const FIELD_BASE =
  "w-full rounded-xl border bg-paper px-4 py-3 text-sm text-ink-950 outline-none transition-colors placeholder:text-slate/60 focus:border-brass-400";

export function CreateUserForm() {
  const { register, errors, isSubmitting, onSubmit } = useCreateUser();

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl rounded-2xl border border-line bg-paper p-8">
      <div className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Nombre completo</label>
          <input
            type="text"
            placeholder="María Torres"
            className={`${FIELD_BASE} ${errors.fullName ? "border-red-400" : "border-line"}`}
            {...register("fullName")}
          />
          {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Correo electrónico</label>
          <input
            type="email"
            placeholder="maria@dds.pe"
            className={`${FIELD_BASE} ${errors.email ? "border-red-400" : "border-line"}`}
            {...register("email")}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Contraseña temporal</label>
          <input
            type="password"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            className={`${FIELD_BASE} ${errors.password ? "border-red-400" : "border-line"}`}
            {...register("password")}
          />
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Rol</label>
          <select
            className={`${FIELD_BASE} ${errors.role ? "border-red-400" : "border-line"}`}
            {...register("role")}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.role && <p className="mt-1.5 text-xs text-red-500">{errors.role.message}</p>}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Link
          href="/dashboard/usuarios"
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-mist"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full bg-brass-500 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brass-600 disabled:opacity-60"
        >
          {isSubmitting ? "Creando..." : "Crear usuario"}
          <UserPlus className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
