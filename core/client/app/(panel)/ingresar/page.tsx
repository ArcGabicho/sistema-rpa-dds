"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { FacadeBackdrop } from "@/components/layout/facade-backdrop";
import { useAuth } from "@/hooks/use-auth";
import { SITE } from "@/lib/site-config";

const FIELD_BASE =
  "h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400";

export default function IngresarPage() {
  const { register, errors, isSubmitting, onSubmit } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1722]">
      <FacadeBackdrop />

      <div className="relative flex min-h-screen flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:gap-4">
        <div className="flex flex-col justify-between px-3 py-3 sm:px-5 lg:flex-1 lg:px-10 lg:py-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                <Image src="/assets/icon.png" alt="" width={24} height={24} className="h-6 w-6" />
              </span>
              <span className="whitespace-nowrap font-display text-[15px] font-semibold text-white">
                <span className="sm:hidden">{SITE.shortName}</span>
                <span className="hidden sm:inline">{SITE.name}</span>
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 whitespace-nowrap text-sm text-white/75 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al sitio
            </Link>
          </div>

          <div className="hidden max-w-lg lg:block">
            <h1 className="font-display text-5xl font-semibold leading-[1.1] tracking-tight text-white">
              {SITE.tagline}
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/75">
              Gestiona los leads del sitio, el seguimiento de clientes y los
              accesos de tu equipo desde un solo panel.
            </p>
          </div>
        </div>

        <main className="flex flex-1 items-center justify-center rounded-[20px] bg-white px-6 py-12 sm:px-12 lg:flex-none lg:basis-[44%] lg:px-16">
          <div className="w-full max-w-[26rem]">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-neutral-950">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Ingresa para acceder al panel de administración.
            </p>

            <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-neutral-950">
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@dds.pe"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`mt-1.5 ${FIELD_BASE} ${
                    errors.email ? "border-red-400 focus:border-red-500" : "border-neutral-200 focus:border-neutral-950"
                  }`}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-xs text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium text-neutral-950">
                  Contraseña
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={`${FIELD_BASE} pr-11 ${
                      errors.password ? "border-red-400 focus:border-red-500" : "border-neutral-200 focus:border-neutral-950"
                    }`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-950"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1.5 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm text-neutral-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-[4px] border-neutral-300 accent-neutral-950"
                    {...register("rememberMe")}
                  />
                  Recordarme
                </label>
                <a
                  href={`mailto:${SITE.email}?subject=${encodeURIComponent(
                    "Restablecer contraseña del panel",
                  )}`}
                  className="text-sm text-neutral-500 transition-colors hover:text-neutral-950"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <p className="mt-10 text-center text-sm text-neutral-500">
              ¿No tienes cuenta?{" "}
              <a
                href={`mailto:${SITE.email}?subject=${encodeURIComponent(
                  "Solicitud de acceso al panel",
                )}`}
                className="font-semibold text-neutral-950 hover:underline"
              >
                Solicita acceso
              </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
