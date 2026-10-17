import { Ban, CalendarClock, CheckCircle2, Clock, PauseCircle } from "lucide-react";
import { formatDay, instanteUtc } from "@/lib/format-date";
import { BOT_ESTADO_LABELS, INCIDENCIA_ESTADO_LABELS, SEVERIDAD_LABELS, duracion, type Sla } from "@/lib/operacion";

const BADGE = "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap";
const ALERTA = "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";

const BOT: Record<string, string> = {
  activo: "bg-brand-100 text-brand-700",
  en_pausa: "border border-dashed border-line text-ink-500",
  retirado: "border border-line text-ink-400",
};

// `soloSiNoActivo`: lists already filtered to active bots skip the obvious.
export function BotEstadoBadge({ estado, conFalla = false, soloSiNoActivo = false }: { estado: string; conFalla?: boolean; soloSiNoActivo?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {!(soloSiNoActivo && estado === "activo") && <span className={`${BADGE} ${BOT[estado] ?? BOT.activo}`}>{BOT_ESTADO_LABELS[estado] ?? estado}</span>}
      {conFalla && <span className={`${BADGE} ${ALERTA}`}>Con falla</span>}
    </span>
  );
}

const SEVERIDAD: Record<string, string> = {
  critica: "bg-red-600 text-white",
  alta: ALERTA,
  media: "bg-brand-100 text-brand-700",
  baja: "bg-brand-50 text-ink-700 ring-1 ring-inset ring-line",
};

export function SeveridadBadge({ severidad }: { severidad: string }) {
  return <span className={`${BADGE} ${SEVERIDAD[severidad] ?? SEVERIDAD.media}`}>{SEVERIDAD_LABELS[severidad] ?? severidad}</span>;
}

const INCIDENCIA: Record<string, string> = {
  abierta: "bg-white text-ink-950 ring-1 ring-inset ring-ink-400",
  en_atencion: "bg-brand-100 text-brand-700",
  esperando_cliente: "border border-dashed border-line text-ink-500",
  resuelta: "bg-brand-700 text-white",
};

export function IncidenciaEstadoBadge({ estado }: { estado: string }) {
  return <span className={`${BADGE} ${INCIDENCIA[estado] ?? INCIDENCIA.abierta}`}>{INCIDENCIA_ESTADO_LABELS[estado] ?? estado}</span>;
}

// Where an incident stands against its resolution target. `ahora` comes
// from the server render (ms), so the time left is the same on both sides.
export function SlaBadge({ sla, ahora }: { sla: Sla; ahora: number }) {
  const restante = (instanteUtc(sla.venceResolucionUtc) - ahora) / 3_600_000;
  switch (sla.semaforo) {
    case "cumplido":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-brand-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Dentro del SLA
        </span>
      );
    case "incumplido":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-red-600">
          <Ban className="h-3.5 w-3.5" />
          Fuera del SLA
        </span>
      );
    case "vencido":
      return <span className={`${BADGE} ${ALERTA}`}>SLA vencido hace {duracion(-restante)}</span>;
    case "pausado":
      return (
        <span className={`${BADGE} border border-dashed border-line text-ink-500`}>
          <PauseCircle className="h-3.5 w-3.5" />
          SLA en pausa
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${sla.semaforo === "en_riesgo" ? "text-red-600" : "text-ink-500"}`}>
          <Clock className="h-3.5 w-3.5" />
          Quedan {duracion(restante)}
        </span>
      );
  }
}

// Real saving against the estimate: a number and a bar (full at 100 %).
export function Cumplimiento({ valor, className = "" }: { valor: number | null; className?: string }) {
  if (valor === null) return <span className="text-xs text-ink-400">—</span>;
  const pct = Math.round(valor * 100);
  const color = valor >= 0.95 ? "bg-brand-700" : valor >= 0.7 ? "bg-brand-400" : "bg-red-500";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-brand-100">
        <span className={`block h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </span>
      <span className={`text-xs font-semibold tabular-nums ${valor < 0.7 ? "text-red-600" : "text-ink-950"}`}>{pct}%</span>
    </span>
  );
}

// How far a contract, license or credential is from expiring, from the
// API's estado and days left (vencido, por_vencer, vigente, terminado).
export function PlazoBadge({ estado, dias, fecha }: { estado: string; dias: number; fecha: string }) {
  if (estado === "terminado") return <span className={`${BADGE} border border-line text-ink-400`}>Terminado</span>;
  if (estado === "vencido")
    return (
      <span className={`${BADGE} ${ALERTA}`}>
        <CalendarClock className="h-3.5 w-3.5" />
        Venció hace {-dias} {dias === -1 ? "día" : "días"}
      </span>
    );
  if (estado === "por_vencer")
    return (
      <span className={`${BADGE} bg-brand-100 text-brand-700`}>
        <CalendarClock className="h-3.5 w-3.5" />
        {dias === 0 ? "Vence hoy" : `Vence en ${dias} ${dias === 1 ? "día" : "días"}`}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-ink-500">
      <CalendarClock className="h-3.5 w-3.5" />
      Vence el {formatDay(fecha)}
    </span>
  );
}
