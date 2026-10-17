import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { IncidenciasLista } from "@/components/operacion/incidencias-lista";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import type { Paged } from "@/lib/comercial";
import { formatPorcentaje } from "@/lib/diagnostico";
import { formatDateTime } from "@/lib/format-date";
import { puede } from "@/lib/permisos";
import { getMe } from "@/lib/session";
import { CAUSA_LABELS, SEVERIDADES, SLA_OBJETIVOS, duracion, relojServidor, type IncidenciaItem, type IncidenciasResumen } from "@/lib/operacion";

const FILTROS = [
  { value: "abiertas", label: "Abiertas" },
  { value: "resueltas", label: "Resueltas" },
  { value: "todas", label: "Todas" },
];

export default async function IncidenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; botId?: string; empresaId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const estado = FILTROS.some((f) => f.value === params.estado) ? params.estado! : "abiertas";
  const botId = params.botId && /^\d+$/.test(params.botId) ? params.botId : undefined;
  const empresaId = params.empresaId && /^\d+$/.test(params.empresaId) ? params.empresaId : undefined;
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const query = new URLSearchParams({
    page: String(page),
    pageSize: "25",
    ...(q && { q }),
    ...(estado !== "todas" && { estado }),
    ...(botId && { botId }),
    ...(empresaId && { empresaId }),
  });
  const [data, resumen, { me }] = await Promise.all([
    apiGet<Paged<IncidenciaItem>>(`incidencias?${query}`),
    apiGet<IncidenciasResumen>("incidencias/resumen"),
    getMe(),
  ]);

  const ahora = relojServidor();
  const fechas = Object.fromEntries((data?.items ?? []).map((i) => [i.id, formatDateTime(i.createdAtUtc)]));
  const filtro = botId ? data?.items[0]?.botNombre : empresaId ? data?.items[0]?.empresaNombre : null;
  const linkTo = (nextEstado: string) =>
    `/dashboard/incidencias?${new URLSearchParams({ ...(q && { q }), estado: nextEstado, ...(botId && { botId }), ...(empresaId && { empresaId }) })}`;
  const maxCausa = Math.max(1, ...(resumen?.porCausa90.map((c) => c.cantidad) ?? []));

  const kpis: [string, string, string][] = resumen
    ? [
        ["Abiertas", String(resumen.abiertas), resumen.graves > 0 ? `${resumen.graves} críticas o altas` : "Ninguna crítica ni alta"],
        ["Fuera de SLA", String(resumen.fueraDeSla), "abiertas con el plazo de resolución vencido"],
        ["SLA cumplido", formatPorcentaje(resumen.cumplimientoSla90), `de ${resumen.resueltas90} resueltas en 90 días`],
        [
          "Tiempo típico de resolución",
          resumen.horasMedianaResolucion90 === null ? "—" : duracion(resumen.horasMedianaResolucion90),
          "mediana de 90 días, sin la espera del cliente",
        ],
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Incidencias"
        description="El soporte de los bots en producción, con su SLA según la severidad."
        actions={
          puede(me, "operacion", "editar") && (
            <Link href="/dashboard/incidencias/nueva" className={BUTTON_PRIMARY}>
              <Plus className="h-4 w-4" />
              Nueva incidencia
            </Link>
          )
        }
      />

      {resumen && (
        <dl className={`${CARD} mt-8 grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-4`}>
          {kpis.map(([label, value, detalle]) => (
            <div key={label} className="min-w-0 bg-white p-4 sm:p-5">
              <dt className="text-xs text-ink-500">{label}</dt>
              <dd className={`mt-1.5 truncate font-display text-xl font-semibold tracking-tight sm:text-2xl ${label === "Fuera de SLA" && resumen.fueraDeSla > 0 ? "text-red-600" : "text-ink-950"}`}>
                {value}
              </dd>
              <dd className="mt-0.5 text-xs text-ink-400">{detalle}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-line lg:flex-row lg:items-end lg:justify-between">
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
            <form action="/dashboard/incidencias" className="relative pb-3">
              <input type="hidden" name="estado" value={estado} />
              {botId && <input type="hidden" name="botId" value={botId} />}
              {empresaId && <input type="hidden" name="empresaId" value={empresaId} />}
              <Search className="pointer-events-none absolute top-[calc(50%-6px)] left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <label htmlFor="incidencias-q" className="sr-only">
                Buscar
              </label>
              <input id="incidencias-q" name="q" defaultValue={q} placeholder="Código, título, bot o empresa" className={`${INPUT_BASE} ${inputState(false)} h-9 w-full pl-9 lg:w-72`} />
            </form>
          </div>

          {(botId || empresaId) && (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-700">
              Solo {botId ? "del bot" : "de"} <span className="font-medium text-ink-950">{filtro ?? "el filtro elegido"}</span>
              <Link href={`/dashboard/incidencias?${new URLSearchParams({ ...(q && { q }), estado })}`} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-500 hover:bg-brand-50 hover:text-ink-950">
                <X className="h-3 w-3" />
                Quitar filtro
              </Link>
            </p>
          )}

          <div className={`${CARD} mt-5 overflow-hidden`}>
            {!data ? (
              <p className="p-6 text-sm text-ink-500">No se pudieron cargar las incidencias. Intenta de nuevo más tarde.</p>
            ) : data.items.length === 0 ? (
              <p className="p-6 text-sm text-ink-500">{estado === "abiertas" && !q ? "No hay incidencias abiertas." : "Ninguna incidencia coincide con el filtro."}</p>
            ) : (
              <>
                <IncidenciasLista items={data.items} ahora={ahora} fechas={fechas} />
                <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  totalCount={data.totalCount}
                  basePath="/dashboard/incidencias"
                  params={{ q: q || undefined, estado, botId, empresaId }}
                />
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {resumen && resumen.porCausa90.length > 0 && (
            <section className={`${CARD} p-5`}>
              <h2 className="text-base font-semibold text-ink-950">Causas</h2>
              <p className="mt-1 text-xs text-ink-500">De las resueltas en los últimos 90 días.</p>
              <ul className="mt-4 flex flex-col gap-3">
                {resumen.porCausa90.map((c) => (
                  <li key={c.causa}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink-700 first-letter:uppercase">{CAUSA_LABELS[c.causa] ?? c.causa}</span>
                      <span className="font-semibold text-ink-950 tabular-nums">{c.cantidad}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-100">
                      <div className="h-full rounded-full bg-brand-700" style={{ width: `${(c.cantidad / maxCausa) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              {resumen.porCausa90[0]?.causa === "credenciales" && (
                <p className="mt-4 text-xs text-ink-500">
                  Las credenciales vencidas son la causa más frecuente: revisa los{" "}
                  <Link href="/dashboard/vencimientos" className="font-medium text-brand-700 hover:underline">
                    vencimientos
                  </Link>{" "}
                  para renovarlas antes de que detengan un bot.
                </p>
              )}
            </section>
          )}

          <section className={`${CARD} p-5`}>
            <h2 className="text-base font-semibold text-ink-950">Objetivos de SLA</h2>
            <p className="mt-1 text-xs text-ink-500">Horas corridas desde el reporte. El reloj se detiene mientras se espera al cliente.</p>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs text-ink-500">
                <tr>
                  <th className="py-1.5 font-medium">Severidad</th>
                  <th className="py-1.5 text-right font-medium">Respuesta</th>
                  <th className="py-1.5 text-right font-medium">Resolución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-t border-line">
                {SEVERIDADES.map((s) => (
                  <tr key={s.value}>
                    <td className="py-2 text-ink-950">{s.label}</td>
                    <td className="py-2 text-right tabular-nums">{duracion(SLA_OBJETIVOS[s.value]!.respuesta)}</td>
                    <td className="py-2 text-right tabular-nums">{duracion(SLA_OBJETIVOS[s.value]!.resolucion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
