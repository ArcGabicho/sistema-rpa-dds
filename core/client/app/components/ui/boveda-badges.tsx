import { LockKeyhole } from "lucide-react";
import { SECRETO_TIPO_LABELS } from "@/lib/boveda";

export function SecretoTipoBadge({ tipo }: { tipo: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-ink-700 ring-1 ring-inset ring-line">
      {SECRETO_TIPO_LABELS[tipo] ?? tipo}
    </span>
  );
}

export function RestringidaBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-950 px-2.5 py-1 text-xs font-medium text-white">
      <LockKeyhole className="h-3 w-3" />
      Restringida
    </span>
  );
}
