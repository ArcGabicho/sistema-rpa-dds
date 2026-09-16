"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { loginSchema, type LoginFormValues } from "@/lib/auth-schema";

export function useAuth() {
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        sileo.error({
          title: "No se pudo iniciar sesión",
          description: data?.message ?? "Correo o contraseña incorrectos.",
        });
        return;
      }

      sileo.success({
        title: "Sesión iniciada",
        description: `Bienvenido, ${data.user.fullName}.`,
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      sileo.error({
        title: "No se pudo iniciar sesión",
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
