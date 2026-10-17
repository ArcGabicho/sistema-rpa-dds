import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { PropuestaEstadoBadge } from "@/components/ui/propuesta-badges";
import { apiGet } from "@/lib/api";
import { puede } from "@/lib/permisos";
import { getMe } from "@/lib/session";
import type { Paged } from "@/lib/comercial";
import { formatDate, formatDay, todayInLima } from "@/lib/format-date";
import { formatMoneda, type PropuestaListItem } from "@/lib/propuesta";

const FILTROS = [
  { value: "", label: "Todas" },
  { value: "borrador", label: "Borradores" },
  { value: "enviada", label: "Enviadas" },
  { value: "vencida", label: "Vencidas" },
  { value: "aceptada", label: "Aceptadas" },
  { value: "rechazada", label: "Rechazadas" },
];

export default async function PropuestasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const estado = FILTROS.some((f) => f.value === params.estado) ? params.estado! : "";
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const query = new URLSearchParams({ page: String(page), pageSize: "25", ...(q && { q }), ...(estado && { estado }) });
  const [data, { me }] = await Promise.all([apiGet<Paged<PropuestaListItem>>(`propuestas?${query}`), getMe()]);
  const today = todayInLima();

  const linkTo = (nextEstado: string) => {
    const next = new URLSearchParams({ ...(q && { q }), ...(nextEstado && { estado: nextEstado }) });
    const search = next.toString();
    return `/dashboard/propuestas${search ? `?${search}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Propuestas"
        description="Las propuestas técnicas y económicas, sus versiones y qué respondió cada cliente."
        actions={
          puede(me, "propuestas", "editar") && (
            <Link href="/dashboard/propuestas/nueva" className={BUTTON_PRIMARY}>
            <Plus className="h-4 w-4" />
            Nueva propuesta
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
        <form action="/dashboard/propuestas" className="relative pb-3">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <Search className="pointer-events-none absolute top-[calc(50%-6px)] left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <label htmlFor="propuestas-q" className="sr-only">
            Buscar
          </label>
          <input
            id="propuestas-q"
            name="q"
            defaultValue={q}
            placeholder="Código, título o empresa"
            className={`${INPUT_BASE} ${inputState(false)} h-9 w-full pl-9 lg:w-72`}
          />
        </form>
      </div>

      <div className={`${CARD} mt-5 overflow-hidden`}>
        {!data ? (
          <p className="p-6 text-sm text-ink-500">No se pudieron cargar las propuestas. Intenta de nuevo más tarde.</p>
        ) : data.items.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">
            {q || estado ? "Ninguna propuesta coincide con el filtro." : "Aún no hay propuestas. Créalas desde un diagnóstico o una oportunidad."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {data.items.map((p) => (
                <li key={p.id}>
                  <Link href={`/dashboard/propuestas/${p.id}`} className="flex flex-col gap-1 p-4 active:bg-brand-50">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink-950">{p.titulo}</p>
                      <PropuestaEstadoBadge estado={p.estado} validaHasta={p.validaHasta} today={today} />
                    </div>
                    <p className="text-xs text-ink-500">
                      {p.codigo} v{p.version} · {p.empresaNombre}
                    </p>
                    <p className="text-xs font-semibold text-ink-950">{formatMoneda(p.totales.baseImplementacion, p.moneda)} + IGV</p>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-brand-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Propuesta</th>
                    <th className="px-3 py-3 text-right font-medium">Implementación</th>
                    <th className="px-3 py-3 text-right font-medium">Mensual</th>
                    <th className="px-3 py-3 font-medium">Estado</th>
                    <th className="px-3 py-3 font-medium">Enviada</th>
                    <th className="px-5 py-3 font-medium">Válida hasta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-brand-50">
                      <td className="max-w-md px-5 py-3">
                        <Link href={`/dashboard/propuestas/${p.id}`} className="font-medium text-ink-950 hover:underline">
                          {p.titulo}
                        </Link>
                        <p className="truncate text-xs text-ink-500">
                          <span className="font-mono">
                            {p.codigo} v{p.version}
                          </span>{" "}
                          · {p.empresaNombre}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular-nums text-ink-950">
                        {formatMoneda(p.totales.baseImplementacion, p.moneda)}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums text-ink-700">
                        {p.totales.baseMensual > 0 ? formatMoneda(p.totales.baseMensual, p.moneda) : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <PropuestaEstadoBadge estado={p.estado} validaHasta={p.validaHasta} today={today} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-ink-500">{p.enviadaAtUtc ? formatDate(p.enviadaAtUtc) : "—"}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-ink-500">{p.validaHasta ? formatDay(p.validaHasta) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalCount={data.totalCount}
              basePath="/dashboard/propuestas"
              params={{ q: q || undefined, estado: estado || undefined }}
            />
          </>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-400">Montos sin IGV.</p>
    </div>
  );
}
