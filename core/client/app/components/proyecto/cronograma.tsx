import { formatDay } from "@/lib/format-date";
import { HITO_ESTADO_LABELS, type Hito } from "@/lib/proyecto";

const dia = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

// The milestones on a timeline from the project's start to its planned end,
// with today marked. Bars are colored by status; late ones in red.
export function Cronograma({ hitos, inicio, fin, today }: { hitos: Hito[]; inicio: string; fin: string; today: string }) {
  if (hitos.length === 0) return <p className="text-sm text-ink-500">Sin hitos.</p>;
  const desde = Math.min(dia(inicio), ...hitos.map((h) => dia(h.fechaInicio)));
  const hasta = Math.max(dia(fin), ...hitos.map((h) => dia(h.fechaFin))) + 86_400_000;
  const total = hasta - desde;
  const pos = (t: number) => `${Math.min(100, Math.max(0, ((t - desde) / total) * 100))}%`;
  const hoy = dia(today);
  const hoyVisible = hoy >= desde && hoy <= hasta;

  return (
    <div className="relative">
      {hoyVisible && (
        <div className="pointer-events-none absolute inset-y-0 z-10 w-px bg-brand-700/60" style={{ left: `calc(11rem + (100% - 11rem) * ${(hoy - desde) / total})` }}>
          <span className="absolute -top-5 -translate-x-1/2 rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">Hoy</span>
        </div>
      )}
      <ol className="flex flex-col gap-2.5 pt-5">
        {hitos.map((h) => {
          const color =
            h.estado === "completado" ? "bg-brand-700" : h.atrasado ? "bg-red-500" : h.estado === "en_curso" ? "bg-brand-500" : "bg-brand-200";
          return (
            <li key={h.id} className="grid grid-cols-[11rem_minmax(0,1fr)] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-950" title={h.nombre}>
                  {h.nombre}
                </p>
                <p className="text-xs text-ink-500">
                  {formatDay(h.fechaInicio)} – {formatDay(h.fechaFin)}
                </p>
              </div>
              <div className="relative h-3 rounded-full bg-brand-50" title={`${HITO_ESTADO_LABELS[h.estado] ?? h.estado}${h.atrasado ? " · atrasado" : ""}`}>
                <div
                  className={`absolute inset-y-0 rounded-full ${color}`}
                  style={{ left: pos(dia(h.fechaInicio)), width: `calc(${pos(dia(h.fechaFin) + 86_400_000)} - ${pos(dia(h.fechaInicio))})` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
        {[
          ["bg-brand-700", "Completado"],
          ["bg-brand-500", "En curso"],
          ["bg-brand-200", "Pendiente"],
          ["bg-red-500", "Atrasado"],
        ].map(([color, label]) => (
          <li key={label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
