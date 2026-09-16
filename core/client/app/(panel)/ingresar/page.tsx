"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, LogIn } from "lucide-react";
import { AuthVisual } from "@/components/sections/auth-visual";
import { useAuth } from "@/hooks/use-auth";
import { SITE } from "@/lib/site-config";

const FIELD_BASE =
  "w-full rounded-xl border bg-paper px-4 py-3 text-sm text-ink-950 outline-none transition-colors placeholder:text-slate/60 focus:border-brass-400";

export default function IngresarPage() {
  const { register, errors, isSubmitting, onSubmit } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative flex min-h-[16rem] flex-col justify-between overflow-hidden px-8 py-8 lg:min-h-screen lg:w-1/2 lg:px-16 lg:py-12">
        <AuthVisual />

        <div className="relative flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/assets/icon.png" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="font-display text-[15px] font-bold text-paper">
              {SITE.name}
            </span>
          </Link>
          <Link
            href="/"
            className="hidden items-center gap-1.5 text-sm text-paper-dim transition-colors hover:text-paper sm:flex"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al sitio
          </Link>
        </div>

        <div className="relative mt-12 max-w-md lg:mt-0">
          <h1 className="font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-paper sm:text-4xl">
            Automatiza más. Decide mejor.
          </h1>
          <p className="mt-4 text-paper-dim">
            Accede al panel para gestionar los proyectos de analítica,
            automatización e IA de Data Discovery Solutions.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-paper px-6 py-16 sm:px-12">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-2xl font-bold text-ink-950">
            Bienvenido de nuevo
          </h2>
          <p className="mt-2 text-sm text-slate">
            Ingresa para acceder al panel de administración.
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-ink-950">
                Correo
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@dds.pe"
                className={`mt-2 ${FIELD_BASE} ${
                  errors.email ? "border-red-400" : "border-line"
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-ink-950">
                Contraseña
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  className={`${FIELD_BASE} pr-11 ${
                    errors.password ? "border-red-400" : "border-line"
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate hover:text-ink-950"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-line text-brass-500 focus:ring-brass-400"
                  {...register("rememberMe")}
                />
                Recordarme
              </label>
              <a
                href={`mailto:${SITE.email}?subject=${encodeURIComponent(
                  "Restablecer contraseña del panel",
                )}`}
                className="text-sm font-medium text-brass-500 hover:text-brass-600"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brass-500 px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-brass-600 disabled:opacity-60"
            >
              {isSubmitting ? "Ingresando..." : "Ingresar"}
              <LogIn className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
