"use client";

import { useImplementacionLogs } from "@/hooks/use-implementacion-logs";

const LEVEL_STYLES: Record<string, string> = {
  info: "text-slate",
  warning: "text-amber-600",
  error: "text-red-600",
};

export function ImplementacionLogsPanel({ id, keepPolling }: { id: number; keepPolling: boolean }) {
  const { logs, error } = useImplementacionLogs(id, keepPolling);

  return (
    <div className="rounded-2xl border border-line bg-paper p-6">
      <p className="font-display text-sm font-bold text-ink-950">Registro de actividad</p>

      {error && <p className="mt-3 text-sm text-slate">No se pudo actualizar el registro.</p>}

      <ul className="mt-4 flex max-h-80 flex-col gap-2 overflow-y-auto font-mono text-xs">
        {logs.length === 0 && !error && <li className="text-slate">Sin actividad todavía.</li>}
        {logs.map((log) => (
          <li key={log.id} className="flex gap-3">
            <span className="shrink-0 text-slate/70">
              {new Date(log.timestampUtc).toLocaleTimeString("es-PE")}
            </span>
            <span className={LEVEL_STYLES[log.level] ?? "text-slate"}>{log.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
