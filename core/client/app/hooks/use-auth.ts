"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { loginSchema, type LoginFormValues } from "@/lib/auth-schema";

// Where to go after signing in: back to the panel page that sent us here
// (proxy.ts adds ?from=), never anywhere outside the panel.
function destination() {
  const from = new URLSearchParams(window.location.search).get("from");
  return from && /^\/dashboard(\/|$)/.test(from) ? from : "/dashboard";
}

// Outside the hook: the React Compiler can't tell that the submit handler
// below never runs during render, and flags Date.now() in it as impure.
function secondsFromNow(seconds: number) {
  return Date.now() + seconds * 1000;
}

export function useAuth() {
  const router = useRouter();
  // While the API rate-limits the login (429), the form stays locked and
  // counts down to when it can be tried again.
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (lockedUntil === null) return;
    const tick = () => {
      const left = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (left <= 0) {
        setLockedUntil(null);
        setSecondsLeft(0);
      } else {
        setSecondsLeft(left);
      }
    };
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (lockedUntil !== null) return;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 429) {
        const wait = Number(data?.retryAfterSeconds) || 60;
        setLockedUntil(secondsFromNow(wait));
        setSecondsLeft(wait);
        form.resetField("password");
        sileo.error({
          title: "Ingreso pausado por seguridad",
          description: data?.message ?? "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
        });
        return;
      }

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
      router.push(destination());
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
    locked: lockedUntil !== null,
    secondsLeft,
    onSubmit,
  };
}
