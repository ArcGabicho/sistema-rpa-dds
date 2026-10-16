"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil } from "lucide-react";
import { sileo } from "sileo";
import { ProximaAccionLabel } from "@/components/comercial/proxima-accion-label";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { panelFetch } from "@/lib/panel-api";

// The one next step of an open deal. "Hecho" logs it on the timeline and asks
// for the step after it, so an opportunity is never left without one.
export function ProximaAccionCard({
  oportunidadId,
  accion,
  fecha,
  today,
}: {
  oportunidadId: number;
  accion: string | null;
  fecha: string | null;
  today: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit" | "next">("view");
  const [draft, setDraft] = useState({ accion: "", fecha: "" });
  const [saving, setSaving] = useState(false);

  function open(next: "edit" | "next") {
    setDraft(next === "edit" ? { accion: accion ?? "", fecha: fecha?.slice(0, 10) ?? "" } : { accion: "", fecha: "" });
    setMode(next);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (draft.accion.trim() && !draft.fecha) {
      sileo.error({ title: "Falta la fecha", description: "Ponle fecha a la próxima acción." });
      return;
    }

    setSaving(true);
    const result = await panelFetch(`oportunidades/${oportunidadId}/proxima-accion`, {
      method: "PATCH",
      body: {
        proximaAccion: draft.accion.trim() || null,
        proximaAccionFecha: draft.accion.trim() ? draft.fecha : null,
        completarAnterior: mode === "next",
      },
    });
    setSaving(false);

    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar", description: result.message });
      return;
    }
    if (mode === "next") sileo.success({ title: "Acción completada" });
    setMode("view");
    router.refresh();
  }

  return (
    <section className={`${CARD} p-5`}>
      <h2 className="text-sm font-semibold text-ink-950">Próxima acción</h2>

      {mode === "view" ? (
        <>
          <div className="mt-3">
            <ProximaAccionLabel accion={accion} fecha={fecha} today={today} />
          </div>
          <div className="mt-4 flex gap-2">
            {accion && (
              <button type="button" onClick={() => open("next")} className={`${BUTTON_PRIMARY} h-9 flex-1 px-3`}>
                <Check className="h-4 w-4" />
                Hecho
              </button>
            )}
            <button
              type="button"
              onClick={() => open(accion ? "edit" : "next")}
              className={`${BUTTON_SECONDARY} h-9 px-3 ${accion ? "" : "flex-1"}`}
            >
              {accion ? <Pencil className="h-4 w-4" /> : null}
              {accion ? <span className="sr-only">Editar</span> : "Definir próxima acción"}
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={save} className="mt-3 flex flex-col gap-3">
          {mode === "next" && accion && (
            <p className="rounded-md bg-brand-50 px-3 py-2 text-xs text-ink-700">
              <span className="font-semibold">Hecho:</span> {accion}
            </p>
          )}
          <label htmlFor="proxima-accion" className="sr-only">
            Próxima acción
          </label>
          <input
            id="proxima-accion"
            autoFocus
            maxLength={300}
            value={draft.accion}
            onChange={(e) => setDraft({ ...draft, accion: e.target.value })}
            placeholder={mode === "next" ? "¿Cuál es el siguiente paso?" : "Próxima acción"}
            className={`${INPUT_BASE} ${inputState(false)}`}
          />
          <label htmlFor="proxima-accion-fecha" className="sr-only">
            Fecha
          </label>
          <input
            id="proxima-accion-fecha"
            type="date"
            value={draft.fecha}
            onChange={(e) => setDraft({ ...draft, fecha: e.target.value })}
            className={`${INPUT_BASE} ${inputState(false)}`}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("view")} className={`${BUTTON_SECONDARY} h-9 flex-1 px-3`}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className={`${BUTTON_PRIMARY} h-9 flex-1 px-3`}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
