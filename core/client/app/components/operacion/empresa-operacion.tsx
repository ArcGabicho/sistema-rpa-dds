import Link from "next/link";
import { BotEstadoBadge, PlazoBadge } from "@/components/ui/operacion-badges";
import { CARD } from "@/components/ui/panel-styles";
import type { BotItem, Contrato } from "@/lib/operacion";
import { formatMoneda } from "@/lib/propuesta";

// A client's operation at a glance on its company page: its bots, open
// incidents and support contract. Hidden for companies with none.
export function EmpresaOperacion({
  empresaId,
  bots,
  contratos,
  incidenciasAbiertas,
}: {
  empresaId: number;
  bots: BotItem[];
  contratos: Contrato[];
  incidenciasAbiertas: number;
}) {
  if (bots.length === 0 && contratos.length === 0) return null;
  const contrato = contratos.find((c) => c.estado === "vigente") ?? contratos[0];

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 p-5">
        <h2 className="text-base font-semibold text-ink-950">Operación</h2>
        <Link
          href={`/dashboard/incidencias?empresaId=${empresaId}`}
          className={`text-sm font-medium hover:underline ${incidenciasAbiertas > 0 ? "text-red-600" : "text-brand-700"}`}
        >
          {incidenciasAbiertas === 0 ? "Sin incidencias abiertas" : `${incidenciasAbiertas} ${incidenciasAbiertas === 1 ? "incidencia abierta" : "incidencias abiertas"}`}
        </Link>
      </div>
      {contrato && (
        <div className="border-t border-line px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-950">{contrato.nombre}</p>
            <PlazoBadge estado={contrato.vencimiento} dias={contrato.dias} fecha={contrato.fechaFin} />
          </div>
          <p className="mt-0.5 text-xs text-ink-500">
            {formatMoneda(contrato.montoMensual, contrato.moneda)} al mes ·{" "}
            <Link href="/dashboard/vencimientos?vista=contratos" className="hover:text-ink-950 hover:underline">
              ver contratos
            </Link>
          </p>
        </div>
      )}
      {bots.length > 0 && (
        <ul className="divide-y divide-line border-t border-line">
          {bots.map((b) => (
            <li key={b.id}>
              <Link href={`/dashboard/bots/${b.id}`} className="group flex items-center justify-between gap-3 px-5 py-3 hover:bg-brand-50">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-950 group-hover:underline">{b.nombre}</span>
                  <span className="block truncate text-xs text-ink-500">{b.plataforma ?? "—"}</span>
                </span>
                <BotEstadoBadge estado={b.estado} conFalla={b.conFalla} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
