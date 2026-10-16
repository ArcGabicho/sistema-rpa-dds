import { PROPUESTA_ESTADO_LABELS, estadoVisible } from "@/lib/propuesta";

const BADGE = "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap";

const STYLES: Record<string, string> = {
  borrador: "bg-brand-50 text-ink-700 ring-1 ring-inset ring-line",
  enviada: "bg-brand-100 text-brand-700",
  aceptada: "bg-brand-700 text-white",
  rechazada: "border border-line text-ink-400",
  reemplazada: "border border-dashed border-line text-ink-400",
  vencida: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

// A sent proposal past its validity date shows as "Vencida". `today` is
// "YYYY-MM-DD" from the server.
export function PropuestaEstadoBadge({ estado, validaHasta, today }: { estado: string; validaHasta: string | null; today: string }) {
  const visible = estadoVisible(estado, validaHasta, today);
  return <span className={`${BADGE} ${STYLES[visible] ?? STYLES.borrador}`}>{PROPUESTA_ESTADO_LABELS[visible] ?? visible}</span>;
}
