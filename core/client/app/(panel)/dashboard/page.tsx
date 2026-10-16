import Link from "next/link";
import { getApiUrl } from "@/lib/auth";
import { getSessionToken, getSessionUser } from "@/lib/session";
import { ClientStatusBadge } from "@/components/ui/client-status-badge";
import { formatDate } from "@/lib/format-date";

type DashboardSummary = {
  clientsTotal: number;
  clientsNew: number;
  recentClients: { id: number; fullName: string; status: string; createdAtUtc: string }[];
};

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
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
        Bienvenido{user?.name ? `, ${user.name}` : ""}
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">Este es el resumen general de tu panel.</p>

      {error || !data ? (
        <p className="mt-8 rounded-lg bg-white shadow-card p-6 text-sm text-ink-500">
          No se pudo cargar el resumen. Intenta de nuevo más tarde.
        </p>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 divide-x divide-line rounded-lg bg-white shadow-card">
            <div className="p-5 sm:p-6">
              <dt className="text-sm text-ink-500">Leads nuevos</dt>
              <dd className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-950">
                {data.clientsNew}
              </dd>
              <dd className="mt-1 text-xs text-ink-400">Sin contactar todavía</dd>
            </div>
            <div className="p-5 sm:p-6">
              <dt className="text-sm text-ink-500">Clientes totales</dt>
              <dd className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-950">
                {data.clientsTotal}
              </dd>
              <dd className="mt-1 text-xs text-ink-400">Desde el formulario del sitio</dd>
            </div>
          </dl>

          <section className="mt-6 rounded-lg bg-white shadow-card p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-ink-950">Leads recientes</h2>
              <Link
                href="/dashboard/clientes"
                className="text-sm text-ink-500 transition-colors hover:text-ink-950"
              >
                Ver todos
              </Link>
            </div>

            {data.recentClients.length === 0 ? (
              <p className="mt-3 border-t border-line pt-4 text-sm text-ink-500">
                Aún no hay leads registrados.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line border-t border-line text-sm">
                {data.recentClients.map((client) => (
                  <li key={client.id}>
                    <Link
                      href={`/dashboard/clientes/${client.id}`}
                      className="group flex items-center justify-between gap-4 py-3.5"
                    >
                      <span className="truncate font-medium text-ink-950 group-hover:underline">
                        {client.fullName}
                      </span>
                      <span className="flex shrink-0 items-center gap-4">
                        <ClientStatusBadge status={client.status} />
                        <span className="w-20 text-right text-xs text-ink-400">
                          {formatDate(client.createdAtUtc)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
