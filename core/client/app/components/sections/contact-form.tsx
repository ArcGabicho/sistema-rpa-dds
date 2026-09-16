"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { sileo } from "sileo";
import {
  SERVICE_OPTIONS,
  contactSchema,
  type ContactFormValues,
} from "@/lib/contact-schema";

const FIELD_BASE =
  "w-full rounded-xl border bg-paper px-4 py-3 text-sm text-ink-950 outline-none transition-colors placeholder:text-slate/60 focus:border-brass-400";

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    sileo.success({
      title: "Solicitud enviada",
      description: `Gracias ${data.fullName}, te contactaremos en menos de 24 horas.`,
    });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <input
            id="fullName"
            type="text"
            placeholder="*Nombre completo"
            className={`${FIELD_BASE} ${errors.fullName ? "border-red-400" : "border-line"}`}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="mt-1.5 text-xs text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <input
            id="email"
            type="email"
            placeholder="*Correo electrónico"
            className={`${FIELD_BASE} ${errors.email ? "border-red-400" : "border-line"}`}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <input
            id="phone"
            type="tel"
            placeholder="*Número de teléfono"
            className={`${FIELD_BASE} ${errors.phone ? "border-red-400" : "border-line"}`}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <select
            id="service"
            defaultValue=""
            className={`${FIELD_BASE} ${errors.service ? "border-red-400" : "border-line"}`}
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
            <p className="mt-1.5 text-xs text-red-500">{errors.service.message}</p>
          )}
        </div>
      </div>

      <div>
        <textarea
          id="message"
          rows={5}
          placeholder="Escribe tu mensaje..."
          className={`${FIELD_BASE} resize-none ${
            errors.message ? "border-red-400" : "border-line"
          }`}
          {...register("message")}
        />
        {errors.message && (
          <p className="mt-1.5 text-xs text-red-500">{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brass-500 px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-brass-600 disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? "Enviando..." : "Enviar solicitud"}
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
