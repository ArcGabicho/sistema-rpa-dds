"use client";

import { Loader2, Send } from "lucide-react";
import { SERVICE_OPTIONS } from "@/lib/contact-schema";
import { useContact } from "@/hooks/use-contact";

const FIELD_BASE =
  "w-full rounded-lg border bg-white px-3.5 text-sm text-ink-950 outline-none transition-colors placeholder:text-ink-400";

function fieldState(hasError: boolean) {
  return hasError
    ? "border-red-400 focus:border-red-500"
    : "border-line focus:border-brand-500";
}

export function ContactForm() {
  const { register, errors, isSubmitting, onSubmit } = useContact();

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="sr-only">
            Nombre completo
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="*Nombre completo"
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            className={`h-11 ${FIELD_BASE} ${fieldState(!!errors.fullName)}`}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p id="fullName-error" className="mt-1.5 text-xs text-red-500">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="sr-only">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            placeholder="*Correo electrónico"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`h-11 ${FIELD_BASE} ${fieldState(!!errors.email)}`}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="sr-only">
            Número de teléfono
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="*Número de teléfono"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={`h-11 ${FIELD_BASE} ${fieldState(!!errors.phone)}`}
            {...register("phone")}
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1.5 text-xs text-red-500">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="service" className="sr-only">
            ¿Cuál es tu necesidad?
          </label>
          <select
            id="service"
            defaultValue=""
            aria-invalid={errors.service ? true : undefined}
            aria-describedby={errors.service ? "service-error" : undefined}
            className={`h-11 px-3 ${FIELD_BASE} ${fieldState(!!errors.service)}`}
            {...register("service")}
          >
            <option value="" disabled>
              ¿Cuál es tu necesidad?
            </option>
            {SERVICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.service && (
            <p id="service-error" className="mt-1.5 text-xs text-red-500">
              {errors.service.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="sr-only">
          Mensaje
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="Escribe tu mensaje..."
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`resize-none py-3 ${FIELD_BASE} ${fieldState(!!errors.message)}`}
          {...register("message")}
        />
        {errors.message && (
          <p id="message-error" className="mt-1.5 text-xs text-red-500">
            {errors.message.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-6 text-sm font-medium text-white transition-colors hover:bg-ink-900 disabled:opacity-60 sm:w-auto sm:self-start"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {isSubmitting ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}
