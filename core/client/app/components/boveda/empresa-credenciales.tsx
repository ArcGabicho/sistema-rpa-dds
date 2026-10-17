import Link from "next/link";
import { LockKeyhole, Plus } from "lucide-react";
import { CopiarSecretoButton } from "@/components/boveda/copiar-secreto-button";
import { BUTTON_SECONDARY, CARD } from "@/components/ui/panel-styles";
import { VencimientoBadge } from "@/components/ui/vencimiento-badge";
import type { SecretoItem } from "@/lib/boveda";

// A company's credentials from the vault, on its page: names and expiry only,
// with copy buttons (each copy is logged).
export function EmpresaCredenciales({
  empresaId,
  secretos,
  today,
  esAdmin,
  puedeAgregar = true,
}: {
  empresaId: number;
  secretos: SecretoItem[] | null;
  today: string;
  esAdmin: boolean;
  puedeAgregar?: boolean;
}) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex items-center justify-between gap-4 p-5">
        <h2 className="text-base font-semibold text-ink-950">
          Credenciales {secretos && <span className="font-normal text-ink-500">{secretos.length}</span>}
        </h2>
        {puedeAgregar && (
          <Link href={`/dashboard/boveda/nuevo?empresaId=${empresaId}`} className={`${BUTTON_SECONDARY} h-9 px-3`}>
            <Plus className="h-4 w-4" />
            Agregar
          </Link>
        )}
      </div>
      {!secretos ? (
        <p className="border-t border-line px-5 py-4 text-sm text-ink-500">No se pudo cargar la bóveda.</p>
      ) : secretos.length === 0 ? (
        <p className="border-t border-line px-5 py-4 text-sm text-ink-500">
          Sin credenciales guardadas. Los accesos que comparta el cliente van a la bóveda, no al correo.
        </p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {secretos.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <Link href={`/dashboard/boveda/${s.id}`} className="group min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium text-ink-950 group-hover:underline">
                  {s.restringido && <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-ink-500" />}
                  <span className="truncate">{s.nombre}</span>
                </p>
                <div className="mt-1">
                  <VencimientoBadge venceEl={s.venceEl} today={today} />
                </div>
              </Link>
              <CopiarSecretoButton id={s.id} nombre={s.nombre} disabled={s.restringido && !esAdmin} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
