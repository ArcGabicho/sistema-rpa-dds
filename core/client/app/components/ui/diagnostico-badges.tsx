import { CUADRANTE_LABELS, DIAGNOSTICO_ESTADO_LABELS } from "@/lib/diagnostico";

const BADGE = "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap";

const ESTADO_STYLES: Record<string, string> = {
  en_curso: "bg-brand-100 text-ink-700",
  entregado: "bg-brand-700 text-white",
  archivado: "border border-line text-ink-400",
};

export function DiagnosticoEstadoBadge({ estado }: { estado: string }) {
  return <span className={`${BADGE} ${ESTADO_STYLES[estado] ?? ESTADO_STYLES.en_curso}`}>{DIAGNOSTICO_ESTADO_LABELS[estado] ?? estado}</span>;
}

// Same colors as the prioritization matrix (lib/chart-theme CUADRANTE_COLORES).
const CUADRANTE_STYLES: Record<string, string> = {
  quick_win: "bg-brand-700 text-white",
  estrategico: "bg-brand-500 text-white",
  mejora_menor: "bg-glow-300 text-ink-950",
  postergar: "border border-line text-ink-500",
};

export function CuadranteBadge({ cuadrante }: { cuadrante: string }) {
  return <span className={`${BADGE} ${CUADRANTE_STYLES[cuadrante] ?? CUADRANTE_STYLES.postergar}`}>{CUADRANTE_LABELS[cuadrante] ?? cuadrante}</span>;
}
