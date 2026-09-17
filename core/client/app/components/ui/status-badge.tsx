const STATUS_STYLES: Record<string, string> = {
  deploying: "bg-brass-400/15 text-brass-600",
  running: "bg-signal-400/15 text-signal-500",
  paused: "bg-mist text-slate",
  error: "bg-red-100 text-red-600",
  deleted: "bg-mist text-slate/70",
};

const STATUS_LABELS: Record<string, string> = {
  deploying: "Desplegando",
  running: "Activo",
  paused: "Pausado",
  error: "Error",
  deleted: "Eliminado",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-mist text-slate";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
