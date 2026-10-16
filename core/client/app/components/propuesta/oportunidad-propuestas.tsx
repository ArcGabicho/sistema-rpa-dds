import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { BUTTON_SECONDARY, CARD } from "@/components/ui/panel-styles";
import { PropuestaEstadoBadge } from "@/components/ui/propuesta-badges";
import { formatMoneda, type PropuestaListItem } from "@/lib/propuesta";

// The opportunity's proposals (every version), newest first, on its page.
export function OportunidadPropuestas({
  oportunidadId,
  propuestas,
  today,
}: {
  oportunidadId: number;
  propuestas: PropuestaListItem[] | null;
  today: string;
}) {
  return (
    <section className={`${CARD} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-950">Propuestas</h2>
        {propuestas && propuestas.length > 0 && (
          <Link href={`/dashboard/propuestas/nueva?oportunidadId=${oportunidadId}`} className="text-xs font-semibold text-brand-700 hover:underline">
            Otra
          </Link>
        )}
      </div>
      {!propuestas ? (
        <p className="mt-2 text-sm text-ink-500">No se pudo cargar.</p>
      ) : propuestas.length === 0 ? (
        <>
          <p className="mt-2 text-sm text-ink-500">Arma la propuesta desde el diagnóstico, o en blanco.</p>
          <Link href={`/dashboard/propuestas/nueva?oportunidadId=${oportunidadId}`} className={`${BUTTON_SECONDARY} mt-3 h-9 w-full px-3`}>
            <Plus className="h-4 w-4" />
            Nueva propuesta
          </Link>
        </>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {propuestas.map((p) => (
            <li key={p.id}>
              <Link href={`/dashboard/propuestas/${p.id}`} className="group block py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink-950 group-hover:underline">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                    <span className="font-mono text-xs">
                      {p.codigo} v{p.version}
                    </span>
                  </p>
                  <PropuestaEstadoBadge estado={p.estado} validaHasta={p.validaHasta} today={today} />
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  <span className="font-semibold text-ink-950">{formatMoneda(p.totales.baseImplementacion, p.moneda)}</span>
                  {p.totales.baseMensual > 0 && ` + ${formatMoneda(p.totales.baseMensual, p.moneda)} al mes`} · más IGV
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
