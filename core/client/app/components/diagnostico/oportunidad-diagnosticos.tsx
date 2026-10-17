import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { DiagnosticoEstadoBadge } from "@/components/ui/diagnostico-badges";
import { BUTTON_SECONDARY, CARD } from "@/components/ui/panel-styles";
import { formatSoles } from "@/lib/comercial";
import { formatPayback, type DiagnosticoItem } from "@/lib/diagnostico";

// The opportunity's diagnoses, with their headline figures, on its page.
export function OportunidadDiagnosticos({
  oportunidadId,
  diagnosticos,
  puedeCrear = true,
}: {
  oportunidadId: number;
  diagnosticos: DiagnosticoItem[] | null;
  puedeCrear?: boolean;
}) {
  return (
    <section className={`${CARD} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-950">Diagnóstico</h2>
        {puedeCrear && diagnosticos && diagnosticos.length > 0 && (
          <Link href={`/dashboard/diagnosticos/nuevo?oportunidadId=${oportunidadId}`} className="text-xs font-semibold text-brand-700 hover:underline">
            Otro
          </Link>
        )}
      </div>
      {!diagnosticos ? (
        <p className="mt-2 text-sm text-ink-500">No se pudo cargar.</p>
      ) : diagnosticos.length === 0 ? (
        <>
          <p className="mt-2 text-sm text-ink-500">{puedeCrear ? "Levanta los procesos del cliente para estimar el ahorro y el retorno." : "Aún no tiene diagnóstico."}</p>
          {puedeCrear && <Link href={`/dashboard/diagnosticos/nuevo?oportunidadId=${oportunidadId}`} className={`${BUTTON_SECONDARY} mt-3 h-9 w-full px-3`}>
            <Plus className="h-4 w-4" />
            Iniciar diagnóstico
          </Link>}
        </>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {diagnosticos.map((d) => (
            <li key={d.id}>
              <Link href={`/dashboard/diagnosticos/${d.id}`} className="group block py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink-950 group-hover:underline">
                    <ClipboardList className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                    {d.titulo}
                  </p>
                  <DiagnosticoEstadoBadge estado={d.estado} />
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {d.totales.procesos} procesos · <span className="font-semibold text-ink-950">{formatSoles(d.totales.ahorroAnual)}</span> al
                  año · {formatPayback(d.totales.paybackMeses).toLowerCase()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
