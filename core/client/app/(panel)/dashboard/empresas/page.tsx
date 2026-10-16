import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EmpresaEstadoBadge } from "@/components/ui/comercial-badges";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import { EMPRESA_ESTADOS, type EmpresaItem, type Paged } from "@/lib/comercial";

const FILTROS = [{ value: "", label: "Todas" }, ...EMPRESA_ESTADOS.map((e) => ({ value: e.value, label: `${e.label}s` }))];

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const estado = EMPRESA_ESTADOS.some((e) => e.value === params.estado) ? params.estado! : "";
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  const query = new URLSearchParams({ page: String(page), pageSize: "20", ...(q && { q }), ...(estado && { estado }) });
  const data = await apiGet<Paged<EmpresaItem>>(`empresas?${query}`);

  const linkTo = (nextEstado: string) => {
    const next = new URLSearchParams({ ...(q && { q }), ...(nextEstado && { estado: nextEstado }) });
    const search = next.toString();
    return `/dashboard/empresas${search ? `?${search}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Prospectos y clientes de DDS, con sus contactos y oportunidades."
        actions={
          <Link href="/dashboard/empresas/nueva" className={BUTTON_PRIMARY}>
            <Plus className="h-4 w-4" />
            Nueva empresa
          </Link>
        }
      />

      <div className="mt-6 flex flex-col gap-3 border-b border-line lg:flex-row lg:items-end lg:justify-between">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Estado">
          {FILTROS.map((option) => {
            const active = option.value === estado;
            return (
              <Link
                key={option.value}
                href={linkTo(option.value)}
                aria-current={active ? "page" : undefined}
                className={`border-b-2 px-3 pb-2.5 text-sm whitespace-nowrap transition-colors ${
                  active
                    ? "border-brand-700 font-semibold text-brand-700"
                    : "border-transparent text-ink-500 hover:text-ink-950"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </nav>
        <form action="/dashboard/empresas" className="relative pb-3">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <Search className="pointer-events-none absolute top-[calc(50%-6px)] left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <label htmlFor="empresas-q" className="sr-only">
            Buscar
          </label>
          <input
            id="empresas-q"
            name="q"
            defaultValue={q}
            placeholder="Nombre, razón social o RUC"
            className={`${INPUT_BASE} ${inputState(false)} h-9 w-full pl-9 lg:w-72`}
          />
        </form>
      </div>

      <div className={`${CARD} mt-5 overflow-hidden`}>
        {!data ? (
          <p className="p-6 text-sm text-ink-500">No se pudieron cargar las empresas. Intenta de nuevo más tarde.</p>
        ) : data.items.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">
            {q ? `Ninguna empresa coincide con “${q}”.` : "Aún no hay empresas registradas."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line sm:hidden">
              {data.items.map((empresa) => (
                <li key={empresa.id}>
                  <Link href={`/dashboard/empresas/${empresa.id}`} className="flex flex-col gap-1 p-4 active:bg-brand-50">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink-950">{empresa.nombreComercial}</p>
                      <EmpresaEstadoBadge estado={empresa.estado} />
                    </div>
                    <p className="text-xs text-ink-500">
                      {[empresa.ruc, empresa.rubro, empresa.provincia].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-brand-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Empresa</th>
                    <th className="px-5 py-3 font-medium">RUC</th>
                    <th className="px-5 py-3 font-medium">Rubro</th>
                    <th className="px-5 py-3 font-medium">Provincia</th>
                    <th className="px-5 py-3 text-right font-medium">Contactos</th>
                    <th className="px-5 py-3 text-right font-medium">Oport. abiertas</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((empresa) => (
                    <tr key={empresa.id} className="transition-colors hover:bg-brand-50">
                      <td className="max-w-xs px-5 py-3.5">
                        <Link href={`/dashboard/empresas/${empresa.id}`} className="font-medium text-ink-950 hover:underline">
                          {empresa.nombreComercial}
                        </Link>
                        {empresa.razonSocial && empresa.razonSocial !== empresa.nombreComercial && (
                          <div className="truncate text-xs text-ink-500">{empresa.razonSocial}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-ink-500">{empresa.ruc ?? "—"}</td>
                      <td className="max-w-[14rem] truncate px-5 py-3.5 text-ink-500">{empresa.rubro ?? "—"}</td>
                      <td className="px-5 py-3.5 text-ink-500">{empresa.provincia ?? "—"}</td>
                      <td className="px-5 py-3.5 text-right text-ink-500">{empresa.contactosCount}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={empresa.oportunidadesAbiertas > 0 ? "font-semibold text-ink-950" : "text-ink-400"}>
                          {empresa.oportunidadesAbiertas}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <EmpresaEstadoBadge estado={empresa.estado} />
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
              basePath="/dashboard/empresas"
              params={{ q: q || undefined, estado: estado || undefined }}
            />
          </>
        )}
      </div>
    </div>
  );
}
