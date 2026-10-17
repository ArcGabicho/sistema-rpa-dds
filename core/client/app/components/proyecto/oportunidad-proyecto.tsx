import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { CARD } from "@/components/ui/panel-styles";
import { ProyectoEstadoBadge } from "@/components/ui/proyecto-badges";
import { progreso, type ProyectoItem } from "@/lib/proyecto";

// The won opportunity's delivery, on its page.
export function OportunidadProyecto({ proyectos }: { proyectos: ProyectoItem[] }) {
  if (proyectos.length === 0) return null;
  return (
    <section className={`${CARD} p-5`}>
      <h2 className="text-sm font-semibold text-ink-950">Proyecto</h2>
      <ul className="mt-2 divide-y divide-line">
        {proyectos.map((p) => (
          <li key={p.id}>
            <Link href={`/dashboard/proyectos/${p.id}`} className="group block py-2.5">
              <p className="flex items-center gap-1.5 text-sm font-medium text-ink-950 group-hover:underline">
                <FolderKanban className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                {p.nombre}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <ProyectoEstadoBadge estado={p.estado} atrasado={p.atrasado} />
                <span className="text-xs text-ink-500 tabular-nums">{progreso(p)}% hecho</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
