"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleCheck, CircleX } from "lucide-react";
import { sileo } from "sileo";
import { MotivoPerdidaDialog } from "@/components/comercial/motivo-perdida-dialog";
import { BUTTON_SECONDARY, CARD } from "@/components/ui/panel-styles";
import { ETAPAS_ABIERTAS, ETAPA_LABELS, type Etapa } from "@/lib/comercial";
import { panelFetch } from "@/lib/panel-api";

// The opportunity's stage as a path through the pipeline: click a step to
// move there, or close the deal as won or lost.
export function EtapaStepper({ oportunidadId, etapa, titulo }: { oportunidadId: number; etapa: Etapa; titulo: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [askMotivo, setAskMotivo] = useState(false);
  const current = ETAPAS_ABIERTAS.indexOf(etapa);
  const closed = etapa === "ganada" || etapa === "perdida";

  async function move(next: Etapa, motivoPerdida?: string) {
    if (next === etapa || saving) return;
    setSaving(true);
    const result = await panelFetch(`oportunidades/${oportunidadId}/etapa`, {
      method: "PATCH",
      body: { etapa: next, motivoPerdida: motivoPerdida ?? null },
    });
    setSaving(false);

    if (!result.ok) {
      sileo.error({ title: "No se pudo cambiar la etapa", description: result.message });
      return;
    }
    sileo.success({ title: next === "ganada" ? "¡Oportunidad ganada!" : `Etapa: ${ETAPA_LABELS[next]}` });
    router.refresh();
  }

  return (
    <div className={`${CARD} flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-center`}>
      {/* On a phone the five labels don't fit: name the current stage once instead. */}
      <p className="text-sm text-ink-500 sm:hidden">
        <span className="font-semibold text-brand-700">{ETAPA_LABELS[etapa]}</span>
        {!closed && ` · paso ${current + 1} de ${ETAPAS_ABIERTAS.length}`}
      </p>
      <ol className="grid flex-1 grid-cols-5 gap-1 max-sm:-mt-2" aria-label="Etapa de la oportunidad">
        {ETAPAS_ABIERTAS.map((step, index) => {
          const done = closed ? etapa === "ganada" : index < current;
          const isCurrent = !closed && index === current;
          return (
            <li key={step}>
              <button
                type="button"
                disabled={saving}
                onClick={() => move(step)}
                aria-current={isCurrent ? "step" : undefined}
                title={isCurrent ? undefined : `Mover a ${ETAPA_LABELS[step]}`}
                className={`group flex w-full flex-col gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-brand-50 disabled:cursor-wait`}
              >
                <span
                  className={`h-1.5 w-full rounded-full ${
                    isCurrent ? "bg-brand-700" : done ? "bg-brand-400" : "bg-line group-hover:bg-brand-200"
                  }`}
                />
                <span
                  className={`max-sm:sr-only flex items-center gap-1 truncate text-xs ${
                    isCurrent ? "font-semibold text-brand-700" : done ? "text-ink-700" : "text-ink-400"
                  }`}
                >
                  {done && <Check className="h-3 w-3 shrink-0" />}
                  {ETAPA_LABELS[step]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex shrink-0 gap-2 border-t border-line pt-4 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-4">
        {closed ? (
          <p className="flex h-10 items-center gap-2 text-sm font-semibold text-ink-950">
            {etapa === "ganada" ? (
              <CircleCheck className="h-4 w-4 text-brand-700" />
            ) : (
              <CircleX className="h-4 w-4 text-ink-400" />
            )}
            {ETAPA_LABELS[etapa]} · elige una etapa para reabrirla
          </p>
        ) : (
          <>
            <button type="button" disabled={saving} onClick={() => move("ganada")} className={BUTTON_SECONDARY}>
              <CircleCheck className="h-4 w-4 text-brand-700" />
              Ganada
            </button>
            <button type="button" disabled={saving} onClick={() => setAskMotivo(true)} className={BUTTON_SECONDARY}>
              <CircleX className="h-4 w-4 text-ink-400" />
              Perdida
            </button>
          </>
        )}
      </div>

      <MotivoPerdidaDialog
        open={askMotivo}
        titulo={titulo}
        onCancel={() => setAskMotivo(false)}
        onConfirm={(motivo) => {
          setAskMotivo(false);
          move("perdida", motivo);
        }}
      />
    </div>
  );
}
