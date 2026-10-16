import type { ReactNode } from "react";

// Label + control + error for the panel's forms. The control itself is
// passed as children, so it can be an input, a select or a textarea wired to
// react-hook-form; give it id={id} and aria-describedby={`${id}-error`}.
export function Field({
  id,
  label,
  error,
  hint,
  optional = false,
  className = "",
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-ink-950">
        {label}
        {optional && <span className="text-xs font-normal text-ink-400">Opcional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      )}
    </div>
  );
}
