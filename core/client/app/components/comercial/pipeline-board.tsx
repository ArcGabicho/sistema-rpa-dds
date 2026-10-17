"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX } from "lucide-react";
import { sileo } from "sileo";
import { MotivoPerdidaDialog } from "@/components/comercial/motivo-perdida-dialog";
import { ProximaAccionLabel } from "@/components/comercial/proxima-accion-label";
import {
  ETAPAS_ABIERTAS,
  ETAPA_LABELS,
  SERVICIO_CORTO,
  formatSoles,
  type Etapa,
  type OportunidadItem,
} from "@/lib/comercial";
import { panelFetch } from "@/lib/panel-api";

// Kanban of the open pipeline: drag a card to another stage, or onto "Ganada"
// / "Perdida" (shown while dragging) to close it. Moves apply at once and
// roll back if the API refuses. Without a pointer, the stage can be changed
// from the opportunity's own page. `soloLectura`: no dragging.
export function PipelineBoard({ items, today, soloLectura = false }: { items: OportunidadItem[]; today: string; soloLectura?: boolean }) {
  const router = useRouter();
  // Stage moves made here, laid over the server's list until a refresh
  // brings the same data back (or removed again if the API refuses).
  const [moved, setMoved] = useState<Record<number, Etapa>>({});
  const cards = items
    .map((c) => (moved[c.id] ? { ...c, etapa: moved[c.id]! } : c))
    .filter((c) => ETAPAS_ABIERTAS.includes(c.etapa));
  const [dragId, setDragId] = useState<number | null>(null);
  const [overEtapa, setOverEtapa] = useState<Etapa | null>(null);
  const [perdiendo, setPerdiendo] = useState<OportunidadItem | null>(null);

  async function move(card: OportunidadItem, etapa: Etapa, motivoPerdida?: string) {
    if (card.etapa === etapa) return;
    setMoved((current) => ({ ...current, [card.id]: etapa }));

    const result = await panelFetch(`oportunidades/${card.id}/etapa`, {
      method: "PATCH",
      body: { etapa, motivoPerdida: motivoPerdida ?? null },
    });
    if (!result.ok) {
      setMoved((current) => {
        const next = { ...current };
        delete next[card.id];
        return next;
      });
      sileo.error({ title: "No se pudo mover la oportunidad", description: result.message });
      return;
    }

    if (etapa === "ganada") sileo.success({ title: "¡Oportunidad ganada!", description: card.empresaNombre });
    else if (etapa === "perdida") sileo.success({ title: "Oportunidad cerrada como perdida" });
    router.refresh();
  }

  function drop(etapa: Etapa) {
    const card = cards.find((c) => c.id === dragId);
    setDragId(null);
    setOverEtapa(null);
    if (!card) return;
    if (etapa === "perdida") setPerdiendo(card);
    else move(card, etapa);
  }

  const dropProps = (etapa: Etapa) => ({
    onDragOver: (e: React.DragEvent) => {
      if (dragId === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (overEtapa !== etapa) setOverEtapa(etapa);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverEtapa(null);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      drop(etapa);
    },
  });

  return (
    <>
      <div
        aria-hidden={dragId === null}
        className={`grid grid-cols-2 gap-3 transition-[opacity,margin] ${
          dragId === null ? "pointer-events-none mb-0 h-0 opacity-0" : "mb-4 opacity-100"
        }`}
      >
        {(["ganada", "perdida"] as const).map((etapa) => (
          <div
            key={etapa}
            {...dropProps(etapa)}
            className={`flex h-14 items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm font-semibold transition-colors ${
              overEtapa === etapa
                ? etapa === "ganada"
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-ink-500 bg-ink-500 text-white"
                : etapa === "ganada"
                  ? "border-brand-400 bg-white text-brand-700"
                  : "border-line bg-white text-ink-500"
            }`}
          >
            {etapa === "ganada" ? <CircleCheck className="h-4 w-4" /> : <CircleX className="h-4 w-4" />}
            Marcar como {ETAPA_LABELS[etapa]!.toLowerCase()}
          </div>
        ))}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div className="grid min-w-[60rem] grid-cols-5 gap-3">
          {ETAPAS_ABIERTAS.map((etapa) => {
            const column = cards.filter((c) => c.etapa === etapa);
            const total = column.reduce((sum, c) => sum + (c.valorEstimado ?? 0), 0);
            return (
              <section
                key={etapa}
                aria-label={ETAPA_LABELS[etapa]}
                {...dropProps(etapa)}
                className={`flex min-h-[24rem] flex-col rounded-lg p-2 transition-colors ${
                  overEtapa === etapa ? "bg-brand-200/60 ring-2 ring-brand-500" : "bg-ink-400/10"
                }`}
              >
                <header className="px-2 pt-1.5 pb-3">
                  <h2 className="text-sm font-semibold text-ink-950">
                    {ETAPA_LABELS[etapa]}
                    <span className="ml-1.5 font-normal text-ink-500">{column.length}</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-500">{formatSoles(total)}</p>
                </header>

                <ul className="flex flex-1 flex-col gap-2">
                  {column.map((card) => (
                    <li
                      key={card.id}
                      draggable={!soloLectura}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", String(card.id));
                        setDragId(card.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverEtapa(null);
                      }}
                      className={`rounded-md bg-white p-3 shadow-card transition-shadow hover:shadow-card-hover ${soloLectura ? "" : "cursor-grab active:cursor-grabbing"} ${
                        dragId === card.id ? "opacity-50" : ""
                      }`}
                    >
                      <Link
                        href={`/dashboard/oportunidades/${card.id}`}
                        draggable={false}
                        className="block text-sm leading-snug font-semibold text-ink-950 hover:underline"
                      >
                        {card.titulo}
                      </Link>
                      <p className="mt-1 truncate text-xs text-ink-500">{card.empresaNombre}</p>
                      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-ink-500">{SERVICIO_CORTO[card.servicio] ?? card.servicio}</span>
                        <span className="shrink-0 font-semibold text-ink-950">{formatSoles(card.valorEstimado)}</span>
                      </div>
                      <div className="mt-2.5 border-t border-line pt-2.5">
                        <ProximaAccionLabel
                          accion={card.proximaAccion}
                          fecha={card.proximaAccionFecha}
                          today={today}
                          compact
                        />
                      </div>
                    </li>
                  ))}
                  {column.length === 0 && (
                    <li className="rounded-md border border-dashed border-line px-3 py-6 text-center text-xs text-ink-400">
                      Sin oportunidades
                    </li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <MotivoPerdidaDialog
        open={perdiendo !== null}
        titulo={perdiendo?.titulo}
        onCancel={() => setPerdiendo(null)}
        onConfirm={(motivo) => {
          if (perdiendo) move(perdiendo, "perdida", motivo);
          setPerdiendo(null);
        }}
      />
    </>
  );
}
