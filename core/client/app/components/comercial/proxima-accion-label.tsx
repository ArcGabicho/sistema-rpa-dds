import { CalendarClock } from "lucide-react";
import { formatDay } from "@/lib/format-date";

// The next step and its due date, colored by urgency against today (Lima):
// overdue in red, due today in brand blue. `today` is "YYYY-MM-DD", computed
// on the server so both renders agree.
export function ProximaAccionLabel({
  accion,
  fecha,
  today,
  compact = false,
}: {
  accion: string | null;
  fecha: string | null;
  today: string;
  compact?: boolean;
}) {
  if (!accion) {
    return <p className="text-xs text-ink-400 italic">Sin próxima acción</p>;
  }

  const day = fecha?.slice(0, 10);
  const tone =
    day && day < today ? "text-red-600" : day === today ? "text-brand-700" : "text-ink-500";
  const when = !day ? null : day < today ? `Vencida · ${formatDay(day)}` : day === today ? "Hoy" : formatDay(day);

  return (
    <div className={`flex items-start gap-1.5 text-xs ${tone}`}>
      <CalendarClock className="mt-px h-3.5 w-3.5 shrink-0" />
      <p className={compact ? "line-clamp-2" : ""}>
        {when && <span className="font-semibold">{when}: </span>}
        <span className={day && day < today ? "" : "text-ink-700"}>{accion}</span>
      </p>
    </div>
  );
}
