import { getApiUrl } from "@/lib/auth";
import { getSessionToken } from "@/lib/session";
import { ImplementacionWizard } from "@/components/sections/implementacion-wizard";
import type { ImplementacionTemplate } from "@/lib/implementaciones-schema";

async function getTemplates(): Promise<{ templates: ImplementacionTemplate[]; error: boolean }> {
  const token = await getSessionToken();
  if (!token) return { templates: [], error: true };

  try {
    const response = await fetch(`${getApiUrl()}/api/implementaciones/templates`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) return { templates: [], error: true };

    const templates: ImplementacionTemplate[] = await response.json();
    return { templates, error: false };
  } catch {
    return { templates: [], error: true };
  }
}

export default async function DeployImplementacionPage() {
  const { templates, error } = await getTemplates();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-950">Nueva implementación</h1>
      <p className="mt-1 text-sm text-slate">
        Elige una plantilla, configúrala y despliégala en Azure en minutos.
      </p>

      <div className="mt-8">
        {error ? (
          <p className="rounded-2xl border border-line bg-paper p-8 text-sm text-slate">
            No se pudieron cargar las plantillas disponibles. Intenta de nuevo más tarde.
          </p>
        ) : (
          <ImplementacionWizard templates={templates} />
        )}
      </div>
    </div>
  );
}
