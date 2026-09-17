"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { contactSchema, type ContactFormValues } from "@/lib/contact-schema";

export function useContact() {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        sileo.error({
          title: "No se pudo enviar tu solicitud",
          description: data?.message ?? "Intenta de nuevo en unos minutos.",
        });
        return;
      }

      sileo.success({
        title: "Solicitud enviada",
        description: `Gracias ${values.fullName}, te contactaremos en menos de 24 horas.`,
      });
      form.reset();
    } catch {
      sileo.error({
        title: "No se pudo enviar tu solicitud",
        description: "Ocurrió un error de conexión. Intenta de nuevo.",
      });
    }
  });

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    onSubmit,
  };
}
