"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Loader2, StickyNote } from "lucide-react";
import { sileo } from "sileo";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import type { Seguimiento } from "@/lib/operacion";
import { panelFetch } from "@/lib/panel-api";

export type SeguimientoItem = Seguimiento & {
  // Pre-formatted by the server page: see formatDateTime in lib/format-date.
  createdAtLabel: string;
};

// The incident's history, oldest first like a ticket thread: every change
// is logged on its own, and the team adds notes as it works on it.
export function SeguimientoPanel({ incidenciaId, items }: { incidenciaId: number; items: SeguimientoItem[] }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (texto.trim().length < 2) return;
    setEnviando(true);
    const result = await panelFetch(`incidencias/${incidenciaId}/seguimiento`, { method: "POST", body: { texto: texto.trim() } });
    setEnviando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo agregar la nota", description: result.message });
      return;
    }
    setTexto("");
    router.refresh();
  }

  return (
    <section className={`${CARD} p-6`}>
      <h2 className="text-base font-semibold text-ink-950">Seguimiento</h2>
      <ol className="mt-4">
        {items.map((s, index) => {
          const cambio = s.tipo === "cambio";
          const Icon = cambio ? ArrowRightLeft : StickyNote;
          return (
            <li key={s.id} className="relative flex gap-3 pb-5 last:pb-0">
              {index < items.length - 1 && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" aria-hidden="true" />}
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cambio ? "bg-brand-50 text-ink-400 ring-1 ring-line" : "bg-brand-100 text-brand-700"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-xs text-ink-500">
                  {s.autorNombre && <span className="font-semibold text-ink-950">{s.autorNombre} · </span>}
                  {s.createdAtLabel}
                </p>
                <p className={`mt-1 text-sm whitespace-pre-line ${cambio ? "text-ink-500" : "leading-relaxed text-ink-700"}`}>{s.texto}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <form onSubmit={agregar} className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
        <label htmlFor="seguimiento-texto" className="sr-only">
          Nota
        </label>
        <textarea
          id="seguimiento-texto"
          rows={3}
          maxLength={2000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Qué se revisó, qué se pidió al cliente, qué falta…"
          className={`${INPUT_BASE} ${inputState(false)} h-auto resize-y py-2.5`}
        />
        <div className="flex justify-end">
          <button type="submit" disabled={enviando || texto.trim().length < 2} className={BUTTON_PRIMARY}>
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            Agregar nota
          </button>
        </div>
      </form>
    </section>
  );
}
