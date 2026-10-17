import { redirect } from "next/navigation";
import { BotForm } from "@/components/operacion/bot-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { TeamUser } from "@/lib/comercial";
import { todayInLima } from "@/lib/format-date";
import type { BorradorBot } from "@/lib/operacion";
import { getSessionUser } from "@/lib/session";

// ?procesoId= (from a project's process) brings its company and the
// diagnosis's estimate; a process that already has its bot goes to it.
export default async function NuevoBotPage({ searchParams }: { searchParams: Promise<{ procesoId?: string }> }) {
  const { procesoId } = await searchParams;
  const [users, user, borrador] = await Promise.all([
    apiGet<TeamUser[]>("users"),
    getSessionUser(),
    procesoId && /^\d+$/.test(procesoId) ? apiGet<BorradorBot>(`bots/borrador?procesoId=${procesoId}`) : null,
  ]);
  if (borrador?.botExistenteId) redirect(`/dashboard/bots/${borrador.botExistenteId}`);

  return (
    <div>
      <PageHeader
        back={borrador?.proyectoId ? { href: `/dashboard/proyectos/${borrador.proyectoId}`, label: borrador.proyectoNombre ?? "Proyecto" } : { href: "/dashboard/bots", label: "Bots" }}
        title="Registrar bot en producción"
        description={
          borrador
            ? "El proceso pasa a producción y su tarea de puesta en producción queda hecha."
            : "Un bot que no salió de un proyecto del sistema."
        }
      />
      <div className="mt-8">
        <BotForm borrador={borrador} users={users ?? []} defaultResponsableId={user?.id} today={todayInLima()} />
      </div>
    </div>
  );
}
