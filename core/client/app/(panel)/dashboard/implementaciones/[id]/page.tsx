import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/auth";
import { getSessionToken } from "@/lib/session";
import { StatusBadge } from "@/components/ui/status-badge";
import { ImplementacionActions } from "@/components/sections/implementacion-actions";
import { ImplementacionLogsPanel } from "@/components/sections/implementacion-logs-panel";
import type { Implementacion } from "@/lib/implementaciones-schema";

async function getImplementacion(id: string): Promise<Implementacion | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const response = await fetch(`${getApiUrl()}/api/implementaciones/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ImplementacionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const impl = await getImplementacion(id);
  if (!impl) notFound();

  const configEntries = Object.entries(impl.config);
  const outputEntries = impl.outputs ? Object.entries(impl.outputs) : [];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-ink-950">{impl.name}</h1>
            <StatusBadge status={impl.status} />
          </div>
          <p className="mt-1 text-sm text-slate">{impl.templateName}</p>
        </div>
        <ImplementacionActions id={impl.id} status={impl.status} />
      </div>

      {impl.status === "error" && impl.errorMessage && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-medium">El deployment falló</p>
          <p className="mt-1">{impl.errorMessage}</p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-6">
          <p className="font-display text-sm font-bold text-ink-950">Configuración</p>
          <dl className="mt-4 flex flex-col divide-y divide-line text-sm">
            {configEntries.length === 0 && <p className="py-2 text-slate">Sin parámetros configurados.</p>}
            {configEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate">{key}</dt>
                <dd className="truncate font-medium text-ink-950">{value || "—"}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-slate">Creado</dt>
              <dd className="font-medium text-ink-950">{formatDateTime(impl.createdAtUtc)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-slate">Actualizado</dt>
              <dd className="font-medium text-ink-950">{formatDateTime(impl.updatedAtUtc)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-6">
          <p className="font-display text-sm font-bold text-ink-950">Salidas del deployment</p>
          {outputEntries.length === 0 ? (
            <p className="mt-4 text-sm text-slate">
              {impl.status === "deploying"
                ? "Todavía desplegando — las salidas aparecerán cuando termine."
                : "Sin salidas disponibles."}
            </p>
          ) : (
            <dl className="mt-4 flex flex-col divide-y divide-line text-sm">
              {outputEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate">{key}</dt>
                  <dd className="truncate font-medium text-ink-950">
                    {value.startsWith("http") ? (
                      <a href={value} target="_blank" rel="noopener noreferrer" className="text-brass-500 hover:text-brass-600">
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <div className="mt-6">
        <ImplementacionLogsPanel id={impl.id} keepPolling />
      </div>
    </div>
  );
}
