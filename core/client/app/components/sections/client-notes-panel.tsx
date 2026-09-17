"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { sileo } from "sileo";

type ClientNote = {
  id: number;
  message: string;
  authorName: string;
  createdAtUtc: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
    <div className="rounded-2xl border border-line bg-paper p-6">
      <p className="font-display text-sm font-bold text-ink-950">Notas del equipo</p>

      <ul className="mt-4 flex max-h-72 flex-col gap-3 overflow-y-auto">
        {notes.length === 0 && <li className="text-sm text-slate">Aún no hay notas para este lead.</li>}
        {notes.map((note) => (
          <li key={note.id} className="rounded-xl bg-mist p-3.5 text-sm">
            <p className="text-ink-950">{note.message}</p>
            <p className="mt-1.5 text-xs text-slate">
              {note.authorName} · {formatDateTime(note.createdAtUtc)}
            </p>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe una nota interna..."
          className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink-950 outline-none transition-colors placeholder:text-slate/60 focus:border-brass-400"
        />
        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brass-500 px-4 text-paper transition-colors hover:bg-brass-600 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
