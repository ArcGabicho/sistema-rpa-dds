import Link from "next/link";
import { AccesosList } from "@/components/boveda/accesos-list";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { CARD } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import { ACCIONES, ACCION_LABELS, type AccesoSecreto } from "@/lib/boveda";
import type { Paged } from "@/lib/comercial";
import { formatDateTime } from "@/lib/format-date";

// The vault's whole audit trail (admins only: proxy.ts and the API both check).
export default async function RegistroBovedaPage({
  searchParams,
}: {
  searchParams: Promise<{ accion?: string; page?: string }>;
}) {
  const params = await searchParams;
  const accion = ACCIONES.includes(params.accion ?? "") ? params.accion! : "";
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const query = new URLSearchParams({ page: String(page), pageSize: "50", ...(accion && { accion }) });
  const data = await apiGet<Paged<AccesoSecreto>>(`boveda/accesos?${query}`);

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/boveda", label: "Bóveda" }}
        title="Registro de accesos"
        description="Todo lo que se hizo en la bóveda, incluidas las credenciales ya eliminadas."
      />

      <nav className="mt-6 -mb-px flex gap-1 overflow-x-auto border-b border-line" aria-label="Acción">
        {["", ...ACCIONES].map((value) => {
          const active = value === accion;
          return (
            <Link
              key={value || "todas"}
              href={value ? `/dashboard/boveda/registro?accion=${value}` : "/dashboard/boveda/registro"}
              aria-current={active ? "page" : undefined}
              className={`border-b-2 px-3 pb-2.5 text-sm whitespace-nowrap transition-colors ${
                active ? "border-brand-700 font-semibold text-brand-700" : "border-transparent text-ink-500 hover:text-ink-950"
              }`}
            >
              {value ? ACCION_LABELS[value] : "Todo"}
            </Link>
          );
        })}
      </nav>

      <div className={`${CARD} mt-5 overflow-hidden`}>
        {!data ? (
          <p className="p-6 text-sm text-ink-500">No se pudo cargar el registro. Intenta de nuevo más tarde.</p>
        ) : (
          <>
            <div className="px-5">
              <AccesosList
                conSecreto
                accesos={data.items.map((a) => ({ ...a, createdAtLabel: formatDateTime(a.createdAtUtc) }))}
              />
            </div>
            {data.totalCount > 0 && (
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalCount={data.totalCount}
                basePath="/dashboard/boveda/registro"
                params={{ accion: accion || undefined }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
