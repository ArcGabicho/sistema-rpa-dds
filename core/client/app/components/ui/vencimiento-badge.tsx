import { CalendarClock } from "lucide-react";
import { vencimiento } from "@/lib/boveda";
import { formatDay } from "@/lib/format-date";

// When a secret expires, colored like the next actions: expired in red,
// close to it in brand blue. `today` is "YYYY-MM-DD" from the server, so
// both renders agree.
export function VencimientoBadge({ venceEl, today }: { venceEl: string | null; today: string }) {
  const { estado, dias } = vencimiento(venceEl, today);
  if (estado === "sin_vencimiento") return <span className="text-xs text-ink-400">No vence</span>;

  const style =
    estado === "vencido"
      ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
      : estado === "por_vencer"
        ? "bg-brand-100 text-brand-700"
        : "text-ink-500";
  const texto =
    estado === "vencido"
      ? `Venció el ${formatDay(venceEl!)}`
      : estado === "por_vencer"
        ? dias === 0
          ? "Vence hoy"
          : `Vence en ${dias} ${dias === 1 ? "día" : "días"}`
        : `Vence el ${formatDay(venceEl!)}`;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${style}`}>
      <CalendarClock className="h-3.5 w-3.5" />
      {texto}
    </span>
  );
}
