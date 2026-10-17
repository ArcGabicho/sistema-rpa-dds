import { ETAPA_DESARROLLO_LABELS, PDD_ESTADO_LABELS, PROYECTO_ESTADO_LABELS } from "@/lib/proyecto";

const BADGE = "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap";

const PROYECTO: Record<string, string> = {
  planificado: "bg-brand-50 text-ink-700 ring-1 ring-inset ring-line",
  en_curso: "bg-brand-100 text-brand-700",
  en_pausa: "border border-dashed border-line text-ink-500",
  completado: "bg-brand-700 text-white",
  cancelado: "border border-line text-ink-400",
};

export function ProyectoEstadoBadge({ estado, atrasado = false }: { estado: string; atrasado?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${BADGE} ${PROYECTO[estado] ?? PROYECTO.planificado}`}>{PROYECTO_ESTADO_LABELS[estado] ?? estado}</span>
      {atrasado && <span className={`${BADGE} bg-red-50 text-red-700 ring-1 ring-inset ring-red-200`}>Atrasado</span>}
    </span>
  );
}

const PDD: Record<string, string> = {
  borrador: "bg-brand-50 text-ink-700 ring-1 ring-inset ring-line",
  en_revision: "bg-brand-100 text-brand-700",
  aprobado: "bg-brand-700 text-white",
};

export function PddEstadoBadge({ estado, version }: { estado: string; version?: number }) {
  return (
    <span className={`${BADGE} ${PDD[estado] ?? PDD.borrador}`}>
      PDD {PDD_ESTADO_LABELS[estado]?.toLowerCase() ?? estado}
      {version && version > 1 ? ` · v${version}` : ""}
    </span>
  );
}

export function EtapaDesarrolloBadge({ etapa }: { etapa: string }) {
  const style = etapa === "produccion" ? "bg-brand-700 text-white" : "bg-brand-50 text-ink-700 ring-1 ring-inset ring-line";
  return <span className={`${BADGE} ${style}`}>{ETAPA_DESARROLLO_LABELS[etapa] ?? etapa}</span>;
}
