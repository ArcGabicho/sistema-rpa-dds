const STATUS_STYLES: Record<string, string> = {
  nuevo: "bg-brass-400/15 text-brass-600",
  contactado: "bg-signal-400/15 text-signal-500",
  cerrado: "bg-mist text-slate",
};

const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  cerrado: "Cerrado",
};

export function ClientStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-mist text-slate";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
