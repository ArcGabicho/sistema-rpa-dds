// Monochrome scale by urgency: a new lead (still to contact) is the one
// that stands out; closed ones recede.
const STATUS_STYLES: Record<string, string> = {
  nuevo: "bg-neutral-950 text-white",
  contactado: "bg-neutral-100 text-neutral-700",
  cerrado: "border border-neutral-200 text-neutral-400",
};

const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  cerrado: "Cerrado",
};

export function ClientStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-700";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
