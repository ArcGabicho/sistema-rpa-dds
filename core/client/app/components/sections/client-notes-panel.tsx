"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { sileo } from "sileo";

type ClientNote = {
  id: number;
  message: string;
  authorName: string;
  // Pre-formatted by the server page: see formatDateTime in lib/format-date.
  createdAtLabel: string;
};

export function ClientNotesPanel({ clientId, notes }: { clientId: number; notes: ClientNote[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        sileo.error({ title: "No se pudo agregar la nota", description: data?.message ?? "Intenta de nuevo." });
        return;
      }

      setMessage("");
      router.refresh();
    } catch {
      sileo.error({ title: "No se pudo agregar la nota", description: "Ocurrió un error de conexión." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg bg-white shadow-card p-6">
      <h2 className="text-base font-semibold text-ink-950">Notas del equipo</h2>

      <ul className="mt-3 flex max-h-80 flex-col divide-y divide-line overflow-y-auto border-y border-line">
        {notes.length === 0 && (
          <li className="py-4 text-sm text-ink-500">Aún no hay notas para este lead.</li>
        )}
        {notes.map((note) => (
          <li key={note.id} className="py-3.5 text-sm">
            <p className="whitespace-pre-line text-ink-700">{note.message}</p>
            <p className="mt-1 text-xs text-ink-400">
              {note.authorName} · {note.createdAtLabel}
            </p>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <label htmlFor="client-note" className="sr-only">
          Nueva nota
        </label>
        <input
          id="client-note"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe una nota interna..."
          className="h-11 w-full rounded-md border border-line bg-white px-3.5 text-sm text-ink-950 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={submitting || !message.trim()}
          aria-label="Agregar nota"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-700 text-white transition-colors hover:bg-ink-900 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
