import type { ReactNode } from "react";

// Fluent-style flyout for chart tooltips: a title and label/value rows.
export function ChartTooltipCard({ title, rows }: { title: ReactNode; rows: { label: string; value: ReactNode; color?: string }[] }) {
  return (
    <div className="min-w-40 rounded-md border border-line bg-white px-3 py-2.5 text-xs shadow-flyout">
      <p className="font-semibold text-ink-950">{title}</p>
      <dl className="mt-1.5 flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-ink-500">
              {row.color && <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />}
              {row.label}
            </dt>
            <dd className="font-semibold text-ink-950 tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
