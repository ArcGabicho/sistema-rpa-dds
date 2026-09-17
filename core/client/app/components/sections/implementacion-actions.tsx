"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";
import { sileo } from "sileo";

const BUTTON_BASE =
  "inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-mist disabled:opacity-60";

export function ImplementacionActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"pause" | "resume" | "delete" | null>(null);

  async function handlePauseResume(action: "pause" | "resume") {
    setLoading(action);
    try {
      const response = await fetch(`/api/implementaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        sileo.error({ title: "No se pudo actualizar", description: data?.message ?? "Intenta de nuevo." });
        return;
      }

      sileo.success({ title: action === "pause" ? "Servicio pausado" : "Servicio reanudado" });
      router.refresh();
    } catch {
      sileo.error({ title: "No se pudo actualizar", description: "Ocurrió un error de conexión." });
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar esta implementación? Esta acción no se puede deshacer.")) return;

    setLoading("delete");
    try {
      const response = await fetch(`/api/implementaciones/${id}`, { method: "DELETE" });
      if (!response.ok) {
        sileo.error({ title: "No se pudo eliminar", description: "Intenta de nuevo." });
        return;
      }

      sileo.success({ title: "Implementación eliminada" });
      router.push("/dashboard/implementaciones");
      router.refresh();
    } catch {
      sileo.error({ title: "No se pudo eliminar", description: "Ocurrió un error de conexión." });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {status === "running" && (
        <button type="button" onClick={() => handlePauseResume("pause")} disabled={loading !== null} className={BUTTON_BASE}>
          <Pause className="h-4 w-4" />
          {loading === "pause" ? "Pausando..." : "Pausar"}
        </button>
      )}
      {status === "paused" && (
        <button type="button" onClick={() => handlePauseResume("resume")} disabled={loading !== null} className={BUTTON_BASE}>
          <Play className="h-4 w-4" />
          {loading === "resume" ? "Reanudando..." : "Reanudar"}
        </button>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
        {loading === "delete" ? "Eliminando..." : "Eliminar"}
      </button>
    </div>
  );
}
