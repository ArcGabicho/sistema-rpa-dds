import { CORE_VALUES } from "@/lib/core-values";

export function CoreValues() {
  return (
    <div className="mx-auto mt-20 grid max-w-5xl gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {CORE_VALUES.map((value) => (
        <div key={value.title} className="border-t-2 border-brass-400 pt-5">
          <h3 className="font-display text-base font-bold text-ink-950">
            {value.title}
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-slate">
            {value.description}
          </p>
        </div>
      ))}
    </div>
  );
}
