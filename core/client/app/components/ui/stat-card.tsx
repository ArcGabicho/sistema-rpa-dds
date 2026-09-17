import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "brass",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: "brass" | "signal" | "red" | "slate";
}) {
  const accentClasses = {
    brass: "bg-brass-500/10 text-brass-500",
    signal: "bg-signal-400/15 text-signal-500",
    red: "bg-red-100 text-red-600",
    slate: "bg-mist text-slate",
  }[accent];

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-6">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${accentClasses}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-display text-2xl font-bold text-ink-950">{value}</p>
        <p className="text-sm text-slate">{label}</p>
      </div>
    </div>
  );
}
