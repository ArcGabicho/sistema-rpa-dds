"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Loader2, Mail, Phone, StickyNote, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { sileo } from "sileo";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { ACTIVIDAD_LABELS, ACTIVIDAD_TIPOS, type Actividad } from "@/lib/comercial";
import { panelFetch } from "@/lib/panel-api";

const ICONS: Record<string, LucideIcon> = {
  nota: StickyNote,
  llamada: Phone,
  reunion: Users,
  correo: Mail,
  cambio_etapa: ArrowRightLeft,
};

export type ActividadItem = Actividad & {
  // Pre-formatted by the server page: see formatDateTime in lib/format-date.
  createdAtLabel: string;
};

// The record of every touchpoint with a company: calls, meetings, emails,
// notes and stage moves, newest first, with a composer on top.
export function ActividadTimeline({
  endpoint,
  actividades,
  showOportunidad = false,
}: {
  // API path to post to, e.g. "oportunidades/12/actividades".
  endpoint: string;
  actividades: ActividadItem[];
  showOportunidad?: boolean;
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<string>("nota");
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim()) return;

    setSubmitting(true);
    const result = await panelFetch(endpoint, { method: "POST", body: { tipo, descripcion: descripcion.trim() } });
    setSubmitting(false);

    if (!result.ok) {
      sileo.error({ title: "No se pudo registrar la actividad", description: result.message });
      return;
    }
    setDescripcion("");
    router.refresh();
  }

  return (
    <section className={`${CARD} p-6`}>
      <h2 className="text-base font-semibold text-ink-950">Actividad</h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo de actividad">
          {ACTIVIDAD_TIPOS.map((option) => {
            const Icon = ICONS[option.value]!;
            const selected = tipo === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTipo(option.value)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                  selected
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-line text-ink-700 hover:bg-brand-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
        <label htmlFor={`${endpoint}-descripcion`} className="sr-only">
          Descripción
        </label>
        <textarea
          id={`${endpoint}-descripcion`}
          rows={3}
          maxLength={2000}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder={
            tipo === "llamada"
              ? "¿Qué se habló en la llamada?"
              : tipo === "reunion"
                ? "Acuerdos de la reunión…"
                : tipo === "correo"
                  ? "Resumen del correo enviado o recibido…"
                  : "Escribe una nota para el equipo…"
          }
          className={`${INPUT_BASE} ${inputState(false)} h-auto resize-y py-2.5`}
        />
        <div className="flex justify-end">
          <button type="submit" disabled={submitting || !descripcion.trim()} className={BUTTON_PRIMARY}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar {ACTIVIDAD_LABELS[tipo]!.toLowerCase()}
          </button>
        </div>
      </form>

      {actividades.length === 0 ? (
        <p className="mt-5 border-t border-line pt-5 text-sm text-ink-500">Aún no hay actividad registrada.</p>
      ) : (
        <ol className="mt-5 border-t border-line pt-5">
          {actividades.map((actividad, index) => {
            const Icon = ICONS[actividad.tipo] ?? StickyNote;
            const automatic = actividad.tipo === "cambio_etapa";
            return (
              <li key={actividad.id} className="relative flex gap-3 pb-5 last:pb-0">
                {index < actividades.length - 1 && (
                  <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" aria-hidden="true" />
                )}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    automatic ? "bg-brand-50 text-ink-400 ring-1 ring-line" : "bg-brand-100 text-brand-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-xs text-ink-500">
                    <span className="font-semibold text-ink-950">{actividad.autorNombre}</span>
                    {" · "}
                    {ACTIVIDAD_LABELS[actividad.tipo] ?? actividad.tipo}
                    {" · "}
                    {actividad.createdAtLabel}
                  </p>
                  <p
                    className={`mt-1 text-sm whitespace-pre-line ${automatic ? "text-ink-500" : "leading-relaxed text-ink-700"}`}
                  >
                    {actividad.descripcion}
                  </p>
                  {showOportunidad && actividad.oportunidadId && (
                    <Link
                      href={`/dashboard/oportunidades/${actividad.oportunidadId}`}
                      className="mt-1 inline-block text-xs text-brand-700 hover:underline"
                    >
                      {actividad.oportunidadTitulo}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
