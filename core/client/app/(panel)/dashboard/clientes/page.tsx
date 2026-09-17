import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getApiUrl } from "@/lib/auth";
import { SERVICE_OPTIONS } from "@/lib/contact-schema";
import { getSessionToken } from "@/lib/session";
import { Pagination } from "@/components/ui/pagination";
import { ClientStatusBadge } from "@/components/ui/client-status-badge";

const PAGE_SIZE = 10;

type Client = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: string;
  createdAtUtc: string;
  assignedToUserId: number | null;
  assignedToName: string | null;
};

type PagedClients = {
  items: Client[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const SERVICE_LABELS = Object.fromEntries(
  SERVICE_OPTIONS.map((option) => [option.value, option.label]),
);

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function getClients(page: number): Promise<{ data: PagedClients | null; error: boolean }> {
  const token = await getSessionToken();
  if (!token) return { data: null, error: true };

  try {
    const response = await fetch(
      `${getApiUrl()}/api/clients?page=${page}&pageSize=${PAGE_SIZE}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (!response.ok) return { data: null, error: true };

    const data: PagedClients = await response.json();
    return { data, error: false };
  } catch {
    return { data: null, error: true };
  }
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requestedPage = Number(params.page);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const { data, error } = await getClients(page);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-950">Clientes</h1>
      <p className="mt-1 text-sm text-slate">
        Solicitudes recibidas desde el formulario de contacto del sitio público.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-paper">
        {error || !data ? (
          <p className="p-8 text-sm text-slate">
            No se pudo cargar la lista de clientes. Intenta de nuevo más tarde.
          </p>
        ) : data.items.length === 0 ? (
          <p className="p-8 text-sm text-slate">
            {page > 1
              ? "No hay resultados en esta página."
              : "Aún no se han recibido solicitudes de contacto."}
          </p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-line sm:hidden">
              {data.items.map((client) => (
                <li key={client.id} className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-ink-950">{client.fullName}</p>
                    <ClientStatusBadge status={client.status} />
                  </div>
                  <p className="text-sm text-slate">{client.email}</p>
                  <p className="text-sm text-slate">{client.phone}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex w-fit items-center rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-ink-950">
                      {SERVICE_LABELS[client.service] ?? client.service}
                    </span>
                    {client.assignedToName && (
                      <span className="text-xs text-slate">Asignado a {client.assignedToName}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate/80">{formatDate(client.createdAtUtc)}</p>
                    <Link
                      href={`/dashboard/clientes/${client.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-xs font-medium text-ink-950 transition-colors hover:bg-mist"
                    >
                      Detalles
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-mist/60 text-xs uppercase tracking-wide text-slate">
                  <tr>
                    <th className="px-6 py-3 font-medium">Nombre</th>
                    <th className="px-6 py-3 font-medium">Contacto</th>
                    <th className="px-6 py-3 font-medium">Necesidad</th>
                    <th className="px-6 py-3 font-medium">Estado</th>
                    <th className="px-6 py-3 font-medium">Asignado a</th>
                    <th className="px-6 py-3 font-medium">Fecha</th>
                    <th className="px-6 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((client) => (
                    <tr key={client.id} className="hover:bg-mist/40">
                      <td className="px-6 py-4 font-medium text-ink-950">{client.fullName}</td>
                      <td className="px-6 py-4 text-slate">
                        <div>{client.email}</div>
                        <div className="text-xs text-slate/80">{client.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate">
                        {SERVICE_LABELS[client.service] ?? client.service}
                      </td>
                      <td className="px-6 py-4">
                        <ClientStatusBadge status={client.status} />
                      </td>
                      <td className="px-6 py-4 text-slate">{client.assignedToName ?? "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate">
                        {formatDate(client.createdAtUtc)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/clientes/${client.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-ink-950 transition-colors hover:bg-mist"
                        >
                          Detalles
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalCount={data.totalCount}
              basePath="/dashboard/clientes"
            />
          </>
        )}
      </div>
    </div>
  );
}
