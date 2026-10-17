import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { DiagnosticoEstadoBadge } from "@/components/ui/diagnostico-badges";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import { puede } from "@/lib/permisos";
import { getMe } from "@/lib/session";
import { formatSoles, type Paged } from "@/lib/comercial";
import { DIAGNOSTICO_ESTADOS, formatNumero, formatPayback, type DiagnosticoItem } from "@/lib/diagnostico";
import { formatDate } from "@/lib/format-date";

const FILTROS = [{ value: "", label: "Todos" }, ...DIAGNOSTICO_ESTADOS.map((e) => ({ value: e.value, label: e.label }))];

export default async function DiagnosticosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const estado = DIAGNOSTICO_ESTADOS.some((e) => e.value === params.estado) ? params.estado! : "";
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const query = new URLSearchParams({ page: String(page), pageSize: "25", ...(q && { q }), ...(estado && { estado }) });
  const [data, { me }] = await Promise.all([apiGet<Paged<DiagnosticoItem>>(`diagnosticos?${query}`), getMe()]);

  const linkTo = (nextEstado: string) => {
    const next = new URLSearchParams({ ...(q && { q }), ...(nextEstado && { estado: nextEstado }) });
    const search = next.toString();
    return `/dashboard/diagnosticos${search ? `?${search}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Diagnósticos"
        description="Los procesos levantados con cada cliente, qué tan automatizables son y cuánto ahorrarían."
        actions={
          puede(me, "diagnosticos", "editar") && (
            <Link href="/dashboard/diagnosticos/nuevo" className={BUTTON_PRIMARY}>
            <Plus className="h-4 w-4" />
            Nuevo diagnóstico
          </Link>
          )
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
                  active ? "border-brand-700 font-semibold text-brand-700" : "border-transparent text-ink-500 hover:text-ink-950"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </nav>
        <form action="/dashboard/diagnosticos" className="relative pb-3">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <Search className="pointer-events-none absolute top-[calc(50%-6px)] left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <label htmlFor="diagnosticos-q" className="sr-only">
            Buscar
          </label>
          <input
            id="diagnosticos-q"
            name="q"
            defaultValue={q}
            placeholder="Título o empresa"
            className={`${INPUT_BASE} ${inputState(false)} h-9 w-full pl-9 lg:w-72`}
          />
        </form>
      </div>

      <div className={`${CARD} mt-5 overflow-hidden`}>
        {!data ? (
          <p className="p-6 text-sm text-ink-500">No se pudieron cargar los diagnósticos. Intenta de nuevo más tarde.</p>
        ) : data.items.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">
            {q || estado ? "Ningún diagnóstico coincide con el filtro." : "Aún no hay diagnósticos. Inícialos desde una oportunidad o con “Nuevo diagnóstico”."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {data.items.map((d) => (
                <li key={d.id}>
                  <Link href={`/dashboard/diagnosticos/${d.id}`} className="flex flex-col gap-1 p-4 active:bg-brand-50">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink-950">{d.titulo}</p>
                      <DiagnosticoEstadoBadge estado={d.estado} />
                    </div>
                    <p className="text-xs text-ink-500">{d.empresaNombre}</p>
                    <p className="text-xs text-ink-700">
                      {d.totales.procesos} procesos · <span className="font-semibold">{formatSoles(d.totales.ahorroAnual)}</span> al año
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-brand-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Diagnóstico</th>
                    <th className="px-3 py-3 text-right font-medium">Procesos</th>
                    <th className="px-3 py-3 text-right font-medium">Quick wins</th>
                    <th className="px-3 py-3 text-right font-medium">Horas/mes</th>
                    <th className="px-3 py-3 text-right font-medium">Ahorro anual</th>
                    <th className="px-3 py-3 font-medium">Recuperación</th>
                    <th className="px-3 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Actualizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((d) => (
                    <tr key={d.id} className="transition-colors hover:bg-brand-50">
                      <td className="max-w-sm px-5 py-3">
                        <Link href={`/dashboard/diagnosticos/${d.id}`} className="font-medium text-ink-950 hover:underline">
                          {d.titulo}
                        </Link>
                        <p className="truncate text-xs text-ink-500">
                          {d.empresaNombre}
                          {d.oportunidadTitulo && ` · ${d.oportunidadTitulo}`}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink-700">{d.totales.procesos}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <span className={d.totales.quickWins > 0 ? "font-semibold text-brand-700" : "text-ink-400"}>{d.totales.quickWins}</span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink-700">{formatNumero(d.totales.horasLiberadasMes)}</td>
                      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums text-ink-950">{formatSoles(d.totales.ahorroAnual)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-ink-700">{formatPayback(d.totales.paybackMeses)}</td>
                      <td className="px-3 py-3">
                        <DiagnosticoEstadoBadge estado={d.estado} />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-ink-500">{formatDate(d.updatedAtUtc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalCount={data.totalCount}
              basePath="/dashboard/diagnosticos"
              params={{ q: q || undefined, estado: estado || undefined }}
            />
          </>
        )}
      </div>
    </div>
  );
}
