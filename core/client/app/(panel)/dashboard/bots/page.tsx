import Link from "next/link";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { AhorroChart, AhorroLeyenda } from "@/components/charts/ahorro-chart";
import { BotEstadoBadge, Cumplimiento } from "@/components/ui/operacion-badges";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import { SERVICIO_CORTO, formatSoles, type Paged } from "@/lib/comercial";
import { formatNumero, formatPorcentaje } from "@/lib/diagnostico";
import { formatDay } from "@/lib/format-date";
import { nombreMes, type BotItem, type BotsResumen } from "@/lib/operacion";
import { puede } from "@/lib/permisos";
import { getMe } from "@/lib/session";

const FILTROS = [
  { value: "activo", label: "Activos" },
  { value: "en_pausa", label: "En pausa" },
  { value: "retirado", label: "Retirados" },
  { value: "todos", label: "Todos" },
];

export default async function BotsPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; page?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const estado = params.estado === undefined ? "activo" : FILTROS.some((f) => f.value === params.estado) ? params.estado : "activo";
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const query = new URLSearchParams({ page: String(page), pageSize: "25", ...(q && { q }), ...(estado !== "todos" && { estado }) });
  const [data, resumen, { me }] = await Promise.all([apiGet<Paged<BotItem>>(`bots?${query}`), apiGet<BotsResumen>("bots/resumen"), getMe()]);

  const linkTo = (nextEstado: string) => `/dashboard/bots?${new URLSearchParams({ ...(q && { q }), estado: nextEstado })}`;
  const mes = resumen ? nombreMes(resumen.mes) : "";
  const kpis: [string, string, string][] = resumen
    ? [
        [`Ahorro real · ${mes}`, formatSoles(resumen.ahorroRealMes), `de ${formatSoles(resumen.ahorroEstimadoMes)} estimado`],
        ["Cumplimiento", formatPorcentaje(resumen.cumplimientoMes), "real frente a lo estimado en el diagnóstico"],
        [
          "Bots activos",
          String(resumen.activos),
          [resumen.enPausa > 0 && `${resumen.enPausa} en pausa`, resumen.sinRegistro > 0 && `${resumen.sinRegistro} sin registro de ${nombreMes(resumen.mes, false)}`]
            .filter(Boolean)
            .join(" · ") || "Todos con su registro al día",
        ],
        ["Ahorro acumulado", formatSoles(resumen.ahorroRealAcumulado), `${formatNumero(resumen.horasAcumuladas)} horas liberadas`],
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Bots en producción"
        description="Lo que ya corre en los clientes: cuánto ahorra de verdad frente a lo estimado, y su salud."
        actions={
          puede(me, "operacion", "editar") && (
            <Link href="/dashboard/bots/nuevo" className={BUTTON_PRIMARY}>
              <Plus className="h-4 w-4" />
              Registrar bot
            </Link>
          )
        }
      />

      {resumen && (
        <>
          <dl className={`${CARD} mt-8 grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-4`}>
            {kpis.map(([label, value, detalle]) => (
              <div key={label} className="min-w-0 bg-white p-4 sm:p-5">
                <dt className="text-xs text-ink-500">{label}</dt>
                <dd className="mt-1.5 truncate font-display text-xl font-semibold tracking-tight text-ink-950 sm:text-2xl">{value}</dd>
                <dd className="mt-0.5 text-xs text-ink-400">{detalle}</dd>
              </div>
            ))}
          </dl>

          {resumen.serie.length > 0 && (
            <section className={`${CARD} mt-6 flex flex-col p-6`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-ink-950">Ahorro real frente al estimado</h2>
                <AhorroLeyenda />
              </div>
              <p className="mt-1 text-xs text-ink-500">Por mes cerrado, de los bots con su registro de ese mes.</p>
              <div className="relative mt-4 min-h-64 flex-1">
                <AhorroChart meses={resumen.serie} />
              </div>
            </section>
          )}
        </>
      )}

      <div className="mt-8 flex flex-col gap-3 border-b border-line lg:flex-row lg:items-end lg:justify-between">
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
        <form action="/dashboard/bots" className="relative pb-3">
          <input type="hidden" name="estado" value={estado} />
          <Search className="pointer-events-none absolute top-[calc(50%-6px)] left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <label htmlFor="bots-q" className="sr-only">
            Buscar
          </label>
          <input id="bots-q" name="q" defaultValue={q} placeholder="Bot, plataforma o empresa" className={`${INPUT_BASE} ${inputState(false)} h-9 w-full pl-9 lg:w-72`} />
        </form>
      </div>

      <div className={`${CARD} mt-5 overflow-hidden`}>
        {!data ? (
          <p className="p-6 text-sm text-ink-500">No se pudieron cargar los bots. Intenta de nuevo más tarde.</p>
        ) : data.items.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">
            {q || estado !== "activo" ? "Ningún bot coincide con el filtro." : "Aún no hay bots en producción. Regístralos desde el proceso de un proyecto."}
          </p>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_12rem_9rem_8rem] gap-4 border-b border-line bg-brand-50 px-5 py-2.5 text-xs font-medium text-ink-500 md:grid">
              <span>Bot</span>
              <span>Ahorro de {data.items[0] ? nombreMes(data.items[0].ultimoMes, false) : "último mes"}</span>
              <span>Frente al estimado</span>
              <span className="text-right">Salud</span>
            </div>
            <ul className="divide-y divide-line">
              {data.items.map((b) => (
                <li key={b.id}>
                  <Link href={`/dashboard/bots/${b.id}`} className="group grid gap-3 px-5 py-4 hover:bg-brand-50 md:grid-cols-[minmax(0,1fr)_12rem_9rem_8rem] md:items-center md:gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink-950 group-hover:underline">{b.nombre}</p>
                        <BotEstadoBadge estado={b.estado} conFalla={b.conFalla} soloSiNoActivo />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {b.empresaNombre} · {SERVICIO_CORTO[b.servicio] ?? b.servicio}
                        {b.plataforma && ` · ${b.plataforma}`}
                      </p>
                    </div>
                    <div className="text-sm">
                      {b.ultimo ? (
                        <>
                          <span className="font-semibold text-ink-950 tabular-nums">{formatSoles(b.ultimo.ahorroReal)}</span>
                          <span className="text-xs text-ink-500"> de {formatSoles(b.ultimo.ahorroEstimado)}</span>
                        </>
                      ) : b.sinRegistro ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Sin registro del mes
                        </span>
                      ) : (
                        <span className="text-xs text-ink-400">En producción desde el {formatDay(b.enProduccionDesde)}</span>
                      )}
                    </div>
                    <Cumplimiento valor={b.ultimo?.cumplimiento ?? null} />
                    <div className="text-xs text-ink-500 md:text-right">
                      {b.ultimo?.tasaExito != null && <p>{formatPorcentaje(b.ultimo.tasaExito)} de éxito</p>}
                      <p className={b.incidenciasAbiertas > 0 ? "font-medium text-ink-950" : ""}>
                        {b.incidenciasAbiertas === 0 ? "Sin incidencias" : `${b.incidenciasAbiertas} ${b.incidenciasAbiertas === 1 ? "incidencia abierta" : "incidencias abiertas"}`}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} basePath="/dashboard/bots" params={{ q: q || undefined, estado }} />
          </>
        )}
      </div>
    </div>
  );
}
