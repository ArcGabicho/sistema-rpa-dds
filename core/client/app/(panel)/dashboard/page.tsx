import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { getApiUrl } from "@/lib/auth";
import { getSessionToken, getSessionUser } from "@/lib/session";
import { StatCard } from "@/components/ui/stat-card";
import { ClientStatusBadge } from "@/components/ui/client-status-badge";

type DashboardSummary = {
  clientsTotal: number;
  clientsNew: number;
  recentClients: { id: number; fullName: string; status: string; createdAtUtc: string }[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

async function getSummary(): Promise<{ data: DashboardSummary | null; error: boolean }> {
  const token = await getSessionToken();
  if (!token) return { data: null, error: true };

  try {
    const response = await fetch(`${getApiUrl()}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) return { data: null, error: true };
    return { data: await response.json(), error: false };
  } catch {
    return { data: null, error: true };
  }
}

export default async function DashboardPage() {
  const [user, { data, error }] = await Promise.all([getSessionUser(), getSummary()]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-950">
        Bienvenido{user?.name ? `, ${user.name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-slate">Este es el resumen general de tu panel.</p>

      {error || !data ? (
        <div className="mt-8 rounded-2xl border border-line bg-paper p-8 text-sm text-slate">
          No se pudo cargar el resumen. Intenta de nuevo más tarde.
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <StatCard label="Leads nuevos" value={data.clientsNew} icon={UserPlus} accent="brass" />
            <StatCard label="Clientes totales" value={data.clientsTotal} icon={Users} accent="slate" />
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-paper p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-bold text-ink-950">Leads recientes</p>
              <Link href="/dashboard/clientes" className="text-xs font-medium text-brass-500 hover:text-brass-600">
                Ver todos
              </Link>
            </div>
            <ul className="mt-4 flex flex-col divide-y divide-line text-sm">
              {data.recentClients.length === 0 && (
                <li className="py-3 text-slate">Aún no hay leads registrados.</li>
              )}
              {data.recentClients.map((client) => (
                <li key={client.id}>
                  <Link
                    href={`/dashboard/clientes/${client.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:text-brass-500"
                  >
                    <span className="truncate font-medium text-ink-950">{client.fullName}</span>
                    <span className="flex shrink-0 items-center gap-3">
                      <ClientStatusBadge status={client.status} />
                      <span className="text-xs text-slate/80">{formatDate(client.createdAtUtc)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
