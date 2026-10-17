import type { ReactNode } from "react";
import { ActionLink } from "@/components/ui/action-link";
import { CARD } from "@/components/ui/panel-styles";

// A module's block on the summary: its title, a link into it, its content.
export function SeccionResumen({ titulo, href, enlace, children }: { titulo: string; href: string; enlace: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-950">{titulo}</h2>
        <ActionLink href={href}>{enlace}</ActionLink>
      </div>
      {children}
    </section>
  );
}

export type Kpi = { label: string; valor: ReactNode; detalle?: ReactNode; alerta?: boolean };

// Headline figures in one card; the 1px gaps over a line-colored background
// draw the dividers, on two rows or one.
export function KpiStrip({ kpis }: { kpis: Kpi[] }) {
  return (
    <dl className={`${CARD} mt-4 grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-4`}>
      {kpis.map((k) => (
        <div key={k.label} className="min-w-0 bg-white p-5 sm:p-6">
          <dt className="text-sm text-ink-500">{k.label}</dt>
          <dd className={`mt-2 truncate font-display text-3xl font-semibold tracking-tight sm:text-4xl ${k.alerta ? "text-red-600" : "text-ink-950"}`}>{k.valor}</dd>
          {k.detalle && <dd className="mt-1 text-xs text-ink-400">{k.detalle}</dd>}
        </div>
      ))}
    </dl>
  );
}
