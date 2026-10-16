// Class names shared by the panel's forms and actions (Fluent / Azure portal
// style: rounded-md controls, brand-700 primary).
export const BUTTON_PRIMARY =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-900 disabled:opacity-60";
export const BUTTON_SECONDARY =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-5 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-50 disabled:opacity-60";
export const BUTTON_DANGER =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60";

export const INPUT_BASE =
  "h-10 w-full rounded-md border bg-white px-3 text-sm text-ink-950 outline-none transition-colors placeholder:text-ink-400 disabled:opacity-60";

export function inputState(hasError: boolean) {
  return hasError ? "border-red-400 focus:border-red-500" : "border-line focus:border-brand-500";
}

export const CARD = "rounded-lg bg-white shadow-card";
