import { Eye } from "lucide-react";

// For users who can see a module but not change it: renders its children
// with every input and button inside disabled (a disabled fieldset), so
// panels show their data without offering edits the API would refuse.
// Links keep working. `display: contents` leaves the layout untouched;
// `aviso` adds a line saying why nothing can be changed.
export function SoloLectura({ activo, aviso, children }: { activo: boolean; aviso?: string; children: React.ReactNode }) {
  if (!activo) return children;
  return (
    <>
      {aviso && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink-500">
          <Eye className="h-4 w-4 shrink-0" />
          {aviso}
        </p>
      )}
      <fieldset disabled className="contents">
        {children}
      </fieldset>
    </>
  );
}
