import { NuevoProyectoForm } from "@/components/proyecto/nuevo-proyecto-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { TeamUser } from "@/lib/comercial";
import { todayInLima } from "@/lib/format-date";
import type { Propuesta } from "@/lib/propuesta";
import { proximoLunes } from "@/lib/proyecto";
import { getSessionUser } from "@/lib/session";

// ?propuestaId= (from an accepted proposal) presets everything.
export default async function NuevoProyectoPage({ searchParams }: { searchParams: Promise<{ propuestaId?: string }> }) {
  const { propuestaId } = await searchParams;
  const [users, user, propuesta] = await Promise.all([
    apiGet<TeamUser[]>("users"),
    getSessionUser(),
    propuestaId && /^\d+$/.test(propuestaId) ? apiGet<Propuesta>(`propuestas/${propuestaId}`) : null,
  ]);

  return (
    <div>
      <PageHeader
        back={propuesta ? { href: `/dashboard/propuestas/${propuesta.id}`, label: `${propuesta.codigo} v${propuesta.version}` } : { href: "/dashboard/proyectos", label: "Proyectos" }}
        title="Nuevo proyecto"
        description={propuesta ? "A partir de la propuesta aceptada: su cronograma y su alcance arman el plan." : "Un proyecto en blanco, con un hito para empezar."}
      />
      <div className="mt-8">
        <NuevoProyectoForm
          propuesta={
            propuesta
              ? {
                  id: propuesta.id,
                  nombre: `${propuesta.codigo} v${propuesta.version}`,
                  titulo: propuesta.titulo,
                  empresaNombre: propuesta.empresaNombre,
                  semanas: propuesta.totales.semanas,
                  procesos: propuesta.items.filter((i) => i.tipo === "implementacion").length,
                }
              : undefined
          }
          users={users ?? []}
          defaultResponsableId={user?.id}
          inicioSugerido={proximoLunes(todayInLima())}
        />
      </div>
    </div>
  );
}
