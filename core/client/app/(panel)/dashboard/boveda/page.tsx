import Link from "next/link";
import { History, LockKeyhole, Plus, Search, TriangleAlert } from "lucide-react";
import { CopiarSecretoButton } from "@/components/boveda/copiar-secreto-button";
import { SecretoTipoBadge } from "@/components/ui/boveda-badges";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { VencimientoBadge } from "@/components/ui/vencimiento-badge";
import { apiGet } from "@/lib/api";
import type { BovedaResumen, SecretoItem } from "@/lib/boveda";
import type { Paged } from "@/lib/comercial";
import { todayInLima } from "@/lib/format-date";
import { puede } from "@/lib/permisos";
import { getMe } from "@/lib/session";

const FILTROS = [
  { value: "", label: "Todas" },
  { value: "por_vencer", label: "Por vencer" },
  { value: "vencido", label: "Vencidas" },
  { value: "dds", label: "De DDS" },
] as const;

export default async function BovedaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const filtro = FILTROS.some((f) => f.value === params.filtro) ? params.filtro! : "";
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  const query = new URLSearchParams({
    page: String(page),
    pageSize: "25",
    ...(q && { q }),
    ...(filtro === "dds" ? { soloDds: "true" } : filtro ? { estado: filtro } : {}),
  });
  const [data, resumen, sesion] = await Promise.all([
    apiGet<Paged<SecretoItem>>(`boveda?${query}`),
    apiGet<BovedaResumen>("boveda/resumen"),
    getMe(),
  ]);
  const { me } = sesion;
  const admin = me?.esAdmin === true;
  const today = todayInLima();

  const conteo: Record<string, number | undefined> = { por_vencer: resumen?.porVencer, vencido: resumen?.vencidos };
  const linkTo = (nextFiltro: string) => {
    const next = new URLSearchParams({ ...(q && { q }), ...(nextFiltro && { filtro: nextFiltro }) });
    const search = next.toString();
    return `/dashboard/boveda${search ? `?${search}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Bóveda"
        description="Credenciales, API keys y tokens de DDS y de sus clientes: cifrados, y con registro de cada acceso."
        actions={
          <>
            {admin && (
              <Link href="/dashboard/boveda/registro" className={BUTTON_SECONDARY}>
                <History className="h-4 w-4" />
                Registro de accesos
              </Link>
            )}
            {puede(me, "boveda", "editar") && (
              <Link href="/dashboard/boveda/nuevo" className={BUTTON_PRIMARY}>
                <Plus className="h-4 w-4" />
                Nueva credencial
              </Link>
            )}
          </>
        }
      />

      {resumen && !resumen.configurada && (
        <p className={`${CARD} mt-6 flex items-start gap-2.5 p-4 text-sm text-ink-700`}>
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>
            La bóveda no está configurada: falta la clave maestra (<code className="font-mono text-xs">BOVEDA_CLAVE_MAESTRA</code>) en
            el servidor. Se pueden ver los datos, pero no guardar ni revelar valores.
          </span>
        </p>
      )}

      {resumen && resumen.vencidos > 0 && filtro !== "vencido" && (
        <Link
          href={linkTo("vencido")}
          className={`${CARD} mt-6 flex items-center gap-2.5 p-4 text-sm text-ink-700 transition-shadow hover:shadow-card-hover`}
        >
          <TriangleAlert className="h-4 w-4 shrink-0 text-red-600" />
          <span>
            <span className="font-semibold text-ink-950">
              {resumen.vencidos} {resumen.vencidos === 1 ? "credencial vencida" : "credenciales vencidas"}
            </span>{" "}
            — los bots que las usan pueden estar fallando.
          </span>
        </Link>
      )}

      <div className="mt-6 flex flex-col gap-3 border-b border-line lg:flex-row lg:items-end lg:justify-between">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Filtro">
          {FILTROS.map((option) => {
            const active = option.value === filtro;
            const n = conteo[option.value];
            return (
              <Link
                key={option.value}
                href={linkTo(option.value)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-sm whitespace-nowrap transition-colors ${
                  active ? "border-brand-700 font-semibold text-brand-700" : "border-transparent text-ink-500 hover:text-ink-950"
                }`}
              >
                {option.label}
                {n !== undefined && n > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[11px] font-semibold ${
                      option.value === "vencido" ? "bg-red-50 text-red-700" : "bg-brand-100 text-brand-700"
                    }`}
                  >
                    {n}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <form action="/dashboard/boveda" className="relative pb-3">
          {filtro && <input type="hidden" name="filtro" value={filtro} />}
          <Search className="pointer-events-none absolute top-[calc(50%-6px)] left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <label htmlFor="boveda-q" className="sr-only">
            Buscar
          </label>
          <input
            id="boveda-q"
            name="q"
            defaultValue={q}
            placeholder="Nombre, empresa, usuario o sistema"
            className={`${INPUT_BASE} ${inputState(false)} h-9 w-full pl-9 lg:w-80`}
          />
        </form>
      </div>

      <div className={`${CARD} mt-5 overflow-hidden`}>
        {!data ? (
          <p className="p-6 text-sm text-ink-500">No se pudo cargar la bóveda. Intenta de nuevo más tarde.</p>
        ) : data.items.length === 0 ? (
          <p className="p-6 text-sm text-ink-500">
            {q || filtro ? "Ninguna credencial coincide con el filtro." : "Aún no hay credenciales guardadas."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {data.items.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 p-4">
                  <Link href={`/dashboard/boveda/${s.id}`} className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-medium text-ink-950">
                      {s.restringido && <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-ink-500" />}
                      <span className="truncate">{s.nombre}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {s.empresaNombre ?? "DDS"}
                      {s.usuario && ` · ${s.usuario}`}
                    </p>
                    <div className="mt-1.5">
                      <VencimientoBadge venceEl={s.venceEl} today={today} />
                    </div>
                  </Link>
                  <CopiarSecretoButton id={s.id} nombre={s.nombre} disabled={s.restringido && !admin} />
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-brand-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Credencial</th>
                    <th className="px-5 py-3 font-medium">Empresa</th>
                    <th className="px-5 py-3 font-medium">Acceso</th>
                    <th className="px-5 py-3 font-medium">Vencimiento</th>
                    <th className="px-5 py-3 font-medium">
                      <span className="sr-only">Copiar</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-brand-50">
                      <td className="max-w-xs px-5 py-3">
                        <Link
                          href={`/dashboard/boveda/${s.id}`}
                          className="flex items-center gap-1.5 font-medium text-ink-950 hover:underline"
                        >
                          {s.restringido && (
                            <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-ink-500" aria-label="Restringida" />
                          )}
                          <span className="truncate">{s.nombre}</span>
                        </Link>
                        <div className="mt-1">
                          <SecretoTipoBadge tipo={s.tipo} />
                        </div>
                      </td>
                      <td className="max-w-[13rem] truncate px-5 py-3 whitespace-nowrap text-ink-500">
                        {s.empresaId ? (
                          <Link href={`/dashboard/empresas/${s.empresaId}`} className="hover:text-ink-950 hover:underline">
                            {s.empresaNombre}
                          </Link>
                        ) : (
                          "DDS"
                        )}
                      </td>
                      <td className="max-w-[16rem] px-5 py-3">
                        {s.usuario && <div className="truncate font-mono text-xs text-ink-700">{s.usuario}</div>}
                        {s.url && <div className={`truncate text-xs text-ink-500 ${s.usuario ? "mt-0.5" : ""}`}>{s.url}</div>}
                        {!s.usuario && !s.url && <span className="text-ink-400">—</span>}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <VencimientoBadge venceEl={s.venceEl} today={today} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <CopiarSecretoButton id={s.id} nombre={s.nombre} disabled={s.restringido && !admin} />
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
              basePath="/dashboard/boveda"
              params={{ q: q || undefined, filtro: filtro || undefined }}
            />
          </>
        )}
      </div>
    </div>
  );
}
