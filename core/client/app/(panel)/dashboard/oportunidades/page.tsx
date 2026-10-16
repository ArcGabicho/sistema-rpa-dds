import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PipelineBoard } from "@/components/comercial/pipeline-board";
import { EtapaBadge } from "@/components/ui/comercial-badges";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import { SERVICIO_LABELS, formatSoles, type OportunidadItem, type Paged } from "@/lib/comercial";
import { formatDate, todayInLima } from "@/lib/format-date";
import { getSessionUser } from "@/lib/session";

const VISTAS = [
  { value: "tablero", label: "Embudo" },
  { value: "ganada", label: "Ganadas" },
  { value: "perdida", label: "Perdidas" },
] as const;

type Vista = (typeof VISTAS)[number]["value"];

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; q?: string; mias?: string; page?: string }>;
}) {
  const params = await searchParams;
  const vista: Vista = VISTAS.some((v) => v.value === params.vista) ? (params.vista as Vista) : "tablero";
  const q = params.q?.trim() ?? "";
  const mias = params.mias === "1";
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  const user = await getSessionUser();
  const query = new URLSearchParams({
    etapa: vista === "tablero" ? "abiertas" : vista,
    ...(vista === "tablero" ? { pageSize: "200" } : { page: String(page), pageSize: "20" }),
    ...(q && { q }),
    ...(mias && user && { responsableId: String(user.id) }),
  });
  const data = await apiGet<Paged<OportunidadItem>>(`oportunidades?${query}`);

  const linkTo = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { vista: vista === "tablero" ? undefined : vista, q: q || undefined, mias: mias ? "1" : undefined, ...changes };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const search = next.toString();
    return `/dashboard/oportunidades${search ? `?${search}` : ""}`;
  };

  const total = data?.items.reduce((sum, o) => sum + (o.valorEstimado ?? 0), 0) ?? 0;

  return (
    <div>
      <PageHeader
        title="Oportunidades"
        description="El embudo comercial: de la primera conversación al contrato firmado."
        actions={
          <Link href="/dashboard/oportunidades/nueva" className={BUTTON_PRIMARY}>
            <Plus className="h-4 w-4" />
            Nueva oportunidad
          </Link>
        }
      />

      <div className="mt-6 flex flex-col gap-3 border-b border-line lg:flex-row lg:items-end lg:justify-between">
        <nav className="-mb-px flex gap-1" aria-label="Vistas">
          {VISTAS.map((option) => {
            const active = option.value === vista;
            return (
              <Link
                key={option.value}
                href={linkTo({ vista: option.value === "tablero" ? undefined : option.value, page: undefined })}
                aria-current={active ? "page" : undefined}
                className={`border-b-2 px-3 pb-2.5 text-sm transition-colors ${
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

        <div className="flex flex-wrap items-center gap-3 pb-3">
          <form action="/dashboard/oportunidades" className="relative">
            {vista !== "tablero" && <input type="hidden" name="vista" value={vista} />}
            {mias && <input type="hidden" name="mias" value="1" />}
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <label htmlFor="oportunidades-q" className="sr-only">
              Buscar
            </label>
            <input
              id="oportunidades-q"
              name="q"
              defaultValue={q}
              placeholder="Buscar oportunidad o empresa"
              className={`${INPUT_BASE} ${inputState(false)} h-9 w-64 pl-9`}
            />
          </form>
          <div className="flex rounded-md border border-line bg-white p-0.5 text-sm">
            {[
              { label: "Todas", value: undefined },
              { label: "Mías", value: "1" },
            ].map((option) => {
              const active = (option.value === "1") === mias;
              return (
                <Link
                  key={option.label}
                  href={linkTo({ mias: option.value, page: undefined })}
                  aria-current={active ? "true" : undefined}
                  className={`rounded-[5px] px-3 py-1 font-medium transition-colors ${
                    active ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-brand-50"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5">
        {!data ? (
          <p className={`${CARD} p-6 text-sm text-ink-500`}>
            No se pudieron cargar las oportunidades. Intenta de nuevo más tarde.
          </p>
        ) : vista === "tablero" ? (
          <>
            <p className="mb-4 text-sm text-ink-500">
              <span className="font-semibold text-ink-950">{data.totalCount}</span>{" "}
              {data.totalCount === 1 ? "oportunidad abierta" : "oportunidades abiertas"} ·{" "}
              <span className="font-semibold text-ink-950">{formatSoles(total)}</span> en juego
              {q && ` · búsqueda: “${q}”`}
            </p>
            <PipelineBoard items={data.items} today={todayInLima()} />
          </>
        ) : data.items.length === 0 ? (
          <p className={`${CARD} p-6 text-sm text-ink-500`}>
            {vista === "ganada" ? "Aún no hay oportunidades ganadas." : "No hay oportunidades perdidas."}
          </p>
        ) : (
          <div className={`${CARD} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-brand-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Oportunidad</th>
                    <th className="px-5 py-3 font-medium">Servicio</th>
                    <th className="px-5 py-3 text-right font-medium">Valor</th>
                    <th className="px-5 py-3 font-medium">Responsable</th>
                    <th className="px-5 py-3 font-medium">Cerrada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((o) => (
                    <tr key={o.id} className="transition-colors hover:bg-brand-50">
                      <td className="px-5 py-3.5">
                        <Link href={`/dashboard/oportunidades/${o.id}`} className="font-medium text-ink-950 hover:underline">
                          {o.titulo}
                        </Link>
                        <div className="text-xs text-ink-500">{o.empresaNombre}</div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-500">{SERVICIO_LABELS[o.servicio] ?? o.servicio}</td>
                      <td className="px-5 py-3.5 text-right font-medium whitespace-nowrap text-ink-950">
                        {formatSoles(o.valorEstimado)}
                      </td>
                      <td className="px-5 py-3.5 text-ink-500">{o.responsableNombre ?? "—"}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-ink-500">
                        <span className="flex items-center gap-2">
                          <EtapaBadge etapa={o.etapa} />
                          {formatDate(o.cerradaAtUtc ?? o.updatedAtUtc)}
                        </span>
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
              basePath="/dashboard/oportunidades"
              params={{ vista, q: q || undefined, mias: mias ? "1" : undefined }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
