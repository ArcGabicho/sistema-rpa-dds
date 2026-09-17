import Link from "next/link";
import { Plus } from "lucide-react";
import { getApiUrl } from "@/lib/auth";
import { getSessionToken } from "@/lib/session";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Implementacion } from "@/lib/implementaciones-schema";

const PAGE_SIZE = 10;

type PagedImplementaciones = {
  items: Implementacion[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function getImplementaciones(page: number): Promise<{ data: PagedImplementaciones | null; error: boolean }> {
  const token = await getSessionToken();
  if (!token) return { data: null, error: true };

  try {
    const response = await fetch(
      `${getApiUrl()}/api/implementaciones?page=${page}&pageSize=${PAGE_SIZE}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (!response.ok) return { data: null, error: true };

    const data: PagedImplementaciones = await response.json();
    return { data, error: false };
  } catch {
    return { data: null, error: true };
  }
}

export default async function ImplementacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requestedPage = Number(params.page);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const { data, error } = await getImplementaciones(page);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950">Implementaciones</h1>
          <p className="mt-1 text-sm text-slate">
            Servicios de automatización RPA e IA desplegados en Azure.
          </p>
        </div>
        <Link
          href="/dashboard/implementaciones/deploy"
          className="inline-flex items-center gap-2 rounded-full bg-brass-500 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brass-600"
        >
          <Plus className="h-4 w-4" />
          Nueva implementación
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-paper">
        {error || !data ? (
          <p className="p-8 text-sm text-slate">
            No se pudieron cargar las implementaciones. Intenta de nuevo más tarde.
          </p>
        ) : data.items.length === 0 ? (
          <p className="p-8 text-sm text-slate">
            {page > 1 ? "No hay resultados en esta página." : "Aún no has desplegado ninguna implementación."}
          </p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="divide-y divide-line sm:hidden">
              {data.items.map((impl) => (
                <li key={impl.id}>
                  <Link href={`/dashboard/implementaciones/${impl.id}`} className="flex flex-col gap-2 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink-950">{impl.name}</p>
                      <StatusBadge status={impl.status} />
                    </div>
                    <p className="text-sm text-slate">{impl.templateName}</p>
                    <p className="text-xs text-slate/80">{formatDate(impl.createdAtUtc)}</p>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-mist/60 text-xs uppercase tracking-wide text-slate">
                  <tr>
                    <th className="px-6 py-3 font-medium">Nombre</th>
                    <th className="px-6 py-3 font-medium">Plantilla</th>
                    <th className="px-6 py-3 font-medium">Estado</th>
                    <th className="px-6 py-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((impl) => (
                    <tr key={impl.id} className="cursor-pointer hover:bg-mist/40">
                      <td className="px-6 py-4 font-medium text-ink-950">
                        <Link href={`/dashboard/implementaciones/${impl.id}`} className="block">
                          {impl.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate">{impl.templateName}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={impl.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate">{formatDate(impl.createdAtUtc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalCount={data.totalCount}
              basePath="/dashboard/implementaciones"
            />
          </>
        )}
      </div>
    </div>
  );
}
