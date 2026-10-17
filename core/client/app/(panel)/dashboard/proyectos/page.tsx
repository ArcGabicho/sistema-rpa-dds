import Link from "next/link";
import { Ban, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { ProyectoEstadoBadge } from "@/components/ui/proyecto-badges";
import { apiGet } from "@/lib/api";
import type { Paged } from "@/lib/comercial";
import { formatDay } from "@/lib/format-date";
import { progreso, type ProyectoItem } from "@/lib/proyecto";

const FILTROS = [
  { value: "activos", label: "Activos" },
  { value: "todos", label: "Todos" },
  { value: "completado", label: "Completados" },
  { value: "en_pausa", label: "En pausa" },
  { value: "cancelado", label: "Cancelados" },
];

export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const estado = params.estado === undefined ? "activos" : FILTROS.some((f) => f.value === params.estado) ? params.estado : "activos";
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const query = new URLSearchParams({ page: String(page), pageSize: "25", ...(q && { q }), ...(estado !== "todos" && { estado }) });
  const data = await apiGet<Paged<ProyectoItem>>(`proyectos?${query}`);

  const linkTo = (nextEstado: string) => {
    const next = new URLSearchParams({ ...(q && { q }), estado: nextEstado });
    return `/dashboard/proyectos?${next}`;
  };

  return (
    <div>
      <PageHeader
        title="Proyectos"
        description="La entrega de lo vendido: hitos, tareas y el PDD de cada proceso a automatizar."
        actions={
          <Link href="/dashboard/proyectos/nuevo" className={BUTTON_PRIMARY}>
            <Plus className="h-4 w-4" />
            Nuevo proyecto
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
                  active ? "border-brand-700 font-semibold text-brand-700" : "border-transparent text-ink-500 hover:text-ink-950"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </nav>
        <form action="/dashboard/proyectos" className="relative pb-3">
          <input type="hidden" name="estado" value={estado} />
          <Search className="pointer-events-none absolute top-[calc(50%-6px)] left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <label htmlFor="proyectos-q" className="sr-only">
            Buscar
          </label>
          <input id="proyectos-q" name="q" defaultValue={q} placeholder="Proyecto o empresa" className={`${INPUT_BASE} ${inputState(false)} h-9 w-full pl-9 lg:w-72`} />
        </form>
      </div>

      <div className={`${CARD} mt-5 overflow-hidden`}>
        {!data ? (
          <p className="p-6 text-sm text-ink-500">No se pudieron cargar los proyectos. Intenta de nuevo más tarde.</p>
        ) : data.items.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">
            {q || estado !== "todos" ? "Ningún proyecto coincide con el filtro." : "Aún no hay proyectos. Créalos desde una propuesta aceptada."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {data.items.map((p) => {
                const pct = progreso(p);
                return (
                  <li key={p.id}>
                    <Link href={`/dashboard/proyectos/${p.id}`} className="group grid gap-3 px-5 py-4 hover:bg-brand-50 md:grid-cols-[minmax(0,1fr)_14rem_10rem] md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-ink-950 group-hover:underline">{p.nombre}</p>
                          <ProyectoEstadoBadge estado={p.estado} atrasado={p.atrasado} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-500">
                          {p.empresaNombre}
                          {p.hitoActual && ` · ${p.hitoActual}`}
                          {p.responsableNombre && ` · ${p.responsableNombre}`}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs text-ink-500">
                          <span>
                            {p.tareasHechas}/{p.tareasTotal} tareas
                          </span>
                          <span className="font-semibold text-ink-950 tabular-nums">{pct}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-100">
                          <div className="h-full rounded-full bg-brand-700" style={{ width: `${pct}%` }} />
                        </div>
                        {p.tareasBloqueadas > 0 && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                            <Ban className="h-3 w-3" />
                            {p.tareasBloqueadas} {p.tareasBloqueadas === 1 ? "bloqueada" : "bloqueadas"}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-ink-500 md:text-right">
                        {p.fechaFinReal ? `Terminó el ${formatDay(p.fechaFinReal)}` : `Fin plan ${formatDay(p.fechaFinPlan)}`}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Pagination page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} basePath="/dashboard/proyectos" params={{ q: q || undefined, estado }} />
          </>
        )}
      </div>
    </div>
  );
}
