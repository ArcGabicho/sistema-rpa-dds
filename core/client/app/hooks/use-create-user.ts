"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { createUserSchema, type CreateUserValues } from "@/lib/users-schema";

export function useCreateUser() {
  const router = useRouter();

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: "", email: "", password: "", role: "Operador" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        sileo.error({ title: "No se pudo crear el usuario", description: data?.message ?? "Intenta de nuevo." });
        return;
      }

      sileo.success({ title: "Usuario creado", description: `${values.fullName} ya puede iniciar sesión.` });
      router.push("/dashboard/usuarios");
      router.refresh();
    } catch {
      sileo.error({ title: "No se pudo crear el usuario", description: "Ocurrió un error de conexión." });
    }
  });

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    onSubmit,
  };
}
