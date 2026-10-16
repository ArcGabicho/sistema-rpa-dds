"use client";

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { panelFetch } from "@/lib/panel-api";

// Copies a secret straight to the clipboard without showing it; the API logs
// it as "copiado".
export function CopiarSecretoButton({ id, nombre, disabled = false }: { id: number; nombre: string; disabled?: boolean }) {
  const [estado, setEstado] = useState<"listo" | "copiando" | "copiado">("listo");

  async function copiar() {
    setEstado("copiando");
    const result = await panelFetch<{ valor: string }>(`boveda/${id}/revelar`, { method: "POST", body: { accion: "copiado" } });
    if (!result.ok) {
      setEstado("listo");
      sileo.error({ title: "No se pudo copiar", description: result.message });
      return;
    }
    try {
      await navigator.clipboard.writeText(result.data.valor);
    } catch {
      setEstado("listo");
      sileo.error({ title: "No se pudo copiar", description: "El navegador no permitió usar el portapapeles." });
      return;
    }
    setEstado("copiado");
    sileo.success({ title: "Copiado al portapapeles", description: nombre });
    setTimeout(() => setEstado("listo"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      disabled={disabled || estado === "copiando"}
      aria-label={`Copiar ${nombre}`}
      title={disabled ? "Restringida: solo un administrador puede copiarla" : "Copiar valor"}
      className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-brand-50 hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {estado === "copiando" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : estado === "copiado" ? (
        <Check className="h-4 w-4 text-brand-700" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}
