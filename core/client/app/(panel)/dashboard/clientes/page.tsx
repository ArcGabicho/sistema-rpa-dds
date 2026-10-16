import Link from "next/link";
import { getApiUrl } from "@/lib/auth";
import { SERVICE_OPTIONS } from "@/lib/contact-schema";
import { getSessionToken } from "@/lib/session";
import { Pagination } from "@/components/ui/pagination";
import { ClientStatusBadge } from "@/components/ui/client-status-badge";
import { formatDate } from "@/lib/format-date";

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
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
        Clientes
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Solicitudes recibidas desde el formulario de contacto del sitio público.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-line">
        {error || !data ? (
          <p className="p-6 text-sm text-ink-500">
            No se pudo cargar la lista de clientes. Intenta de nuevo más tarde.
          </p>
        ) : data.items.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">
            {page > 1
              ? "No hay resultados en esta página."
              : "Aún no se han recibido solicitudes de contacto."}
          </p>
        ) : (
          <>
            {/* Mobile: one link per lead */}
            <ul className="divide-y divide-line sm:hidden">
              {data.items.map((client) => (
                <li key={client.id}>
                  <Link
                    href={`/dashboard/clientes/${client.id}`}
                    className="flex flex-col gap-1.5 p-4 transition-colors active:bg-brand-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink-950">{client.fullName}</p>
                      <ClientStatusBadge status={client.status} />
                    </div>
                    <p className="text-sm text-ink-500">{client.email}</p>
                    <p className="text-sm text-ink-500">{client.phone}</p>
                    <p className="mt-1 text-xs text-ink-400">
                      {SERVICE_LABELS[client.service] ?? client.service}
                      {client.assignedToName && ` · Asignado a ${client.assignedToName}`}
                      {` · ${formatDate(client.createdAtUtc)}`}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-brand-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Nombre</th>
                    <th className="px-5 py-3 font-medium">Contacto</th>
                    <th className="px-5 py-3 font-medium">Necesidad</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Asignado a</th>
                    <th className="px-5 py-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((client) => (
                    <tr key={client.id} className="transition-colors hover:bg-brand-50">
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/clientes/${client.id}`}
                          className="font-medium text-ink-950 hover:underline"
                        >
                          {client.fullName}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-ink-500">
                        <div>{client.email}</div>
                        <div className="text-xs text-ink-400">{client.phone}</div>
                      </td>
                      <td className="px-5 py-4 text-ink-500">
                        {SERVICE_LABELS[client.service] ?? client.service}
                      </td>
                      <td className="px-5 py-4">
                        <ClientStatusBadge status={client.status} />
                      </td>
                      <td className="px-5 py-4 text-ink-500">{client.assignedToName ?? "—"}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-ink-500">
                        {formatDate(client.createdAtUtc)}
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
