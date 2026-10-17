import Link from "next/link";
import { IncidenciaEstadoBadge, SeveridadBadge, SlaBadge } from "@/components/ui/operacion-badges";
import type { IncidenciaItem } from "@/lib/operacion";

// Incident rows: code and title, where it happened, and its SLA. `ahora`
// is the server's clock (ms) at render time.
export function IncidenciasLista({
  items,
  ahora,
  mostrarBot = true,
  fechas,
}: {
  items: IncidenciaItem[];
  ahora: number;
  mostrarBot?: boolean;
  // Server-formatted report date per incident id (formatDateTime is server-only).
  fechas: Record<number, string>;
}) {
  return (
    <ul className="divide-y divide-line">
      {items.map((i) => (
        <li key={i.id}>
          <Link href={`/dashboard/incidencias/${i.id}`} className="group grid gap-2 px-5 py-3.5 hover:bg-brand-50 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4">
            <div className="min-w-0">
              <p className="text-sm text-ink-950">
                <span className="mr-2 font-mono text-xs text-ink-500">{i.codigo}</span>
                <span className="font-medium group-hover:underline">{i.titulo}</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-500">
                {mostrarBot ? [i.botNombre, i.empresaNombre].filter(Boolean).join(" · ") : null}
                {mostrarBot ? " · " : ""}
                {fechas[i.id]}
                {i.responsableNombre && ` · ${i.responsableNombre}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <SeveridadBadge severidad={i.severidad} />
              <IncidenciaEstadoBadge estado={i.estado} />
              <SlaBadge sla={i.sla} ahora={ahora} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
