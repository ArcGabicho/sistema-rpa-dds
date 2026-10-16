import { EMPRESA_ESTADO_LABELS, ETAPA_LABELS } from "@/lib/comercial";

const BADGE = "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium";

// Open stages darken as the deal advances; a win is the one solid badge,
// a loss recedes.
const ETAPA_STYLES: Record<string, string> = {
  nuevo: "bg-brand-50 text-ink-700 ring-1 ring-inset ring-line",
  contactado: "bg-brand-100 text-ink-700",
  diagnostico: "bg-brand-200 text-ink-900",
  propuesta: "bg-brand-300 text-ink-950",
  negociacion: "bg-brand-400 text-ink-950",
  ganada: "bg-brand-700 text-white",
  perdida: "border border-line text-ink-400",
};

export function EtapaBadge({ etapa }: { etapa: string }) {
  return <span className={`${BADGE} ${ETAPA_STYLES[etapa] ?? ETAPA_STYLES.nuevo}`}>{ETAPA_LABELS[etapa] ?? etapa}</span>;
}

const ESTADO_STYLES: Record<string, string> = {
  prospecto: "bg-brand-100 text-ink-700",
  cliente: "bg-brand-700 text-white",
  inactiva: "border border-line text-ink-400",
};

export function EmpresaEstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={`${BADGE} ${ESTADO_STYLES[estado] ?? ESTADO_STYLES.prospecto}`}>
      {EMPRESA_ESTADO_LABELS[estado] ?? estado}
    </span>
  );
}
