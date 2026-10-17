"use client";

import { MODULOS, NIVELES, type Modulo, type Nivel } from "@/lib/permisos";

// Access per module as a segmented control: "Sin acceso · Ver · Editar".
// `base` is the role's preset; a module set differently is marked as
// adjusted. Without `onChange` it only shows the levels.
export function PermisosMatriz({
  valores,
  base,
  onChange,
}: {
  valores: Record<Modulo, Nivel>;
  base?: Record<Modulo, Nivel>;
  onChange?: (modulo: Modulo, nivel: Nivel) => void;
}) {
  return (
    <>
      <ul className="divide-y divide-line">
        {MODULOS.map((m) => {
          const valor = valores[m.value] ?? "ninguno";
          const ajustado = base !== undefined && base[m.value] !== valor;
          return (
            <li key={m.value} className="flex flex-col gap-2.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-ink-950">
                  {m.label}
                  {ajustado && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Ajustado</span>}
                </p>
                <p className="mt-0.5 text-xs text-ink-500">{m.ayuda}</p>
              </div>
              <div role="radiogroup" aria-label={`Acceso a ${m.label}`} className="inline-flex shrink-0 rounded-md border border-line bg-white p-0.5">
                {NIVELES.map((n) => {
                  const activo = valor === n.value;
                  const delRol = base?.[m.value] === n.value;
                  return (
                    <button
                      key={n.value}
                      type="button"
                      role="radio"
                      aria-checked={activo}
                      disabled={!onChange}
                      onClick={() => onChange?.(m.value, n.value)}
                      title={delRol ? "El nivel de su rol" : undefined}
                      className={`relative min-w-20 rounded px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-default ${
                        activo
                          ? n.value === "ninguno"
                            ? "bg-ink-700 text-white"
                            : "bg-brand-700 text-white"
                          : "text-ink-500 enabled:hover:bg-brand-50 enabled:hover:text-ink-950"
                      }`}
                    >
                      {n.label}
                      {delRol && !activo && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      {base && onChange && (
        <p className="flex items-center gap-1.5 border-t border-line pt-3 text-xs text-ink-500">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
          El punto marca el nivel que trae su rol.
        </p>
      )}
    </>
  );
}
