import { IncidenciaForm } from "@/components/operacion/incidencia-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { Paged, TeamUser } from "@/lib/comercial";
import type { BotItem } from "@/lib/operacion";
import { getSessionUser } from "@/lib/session";

// ?botId= (from a bot's page) preselects it.
export default async function NuevaIncidenciaPage({ searchParams }: { searchParams: Promise<{ botId?: string }> }) {
  const { botId } = await searchParams;
  const [bots, users, user] = await Promise.all([apiGet<Paged<BotItem>>("bots?pageSize=100"), apiGet<TeamUser[]>("users"), getSessionUser()]);
  const enOperacion = (bots?.items ?? []).filter((b) => b.estado !== "retirado");
  const elegido = botId && /^\d+$/.test(botId) ? enOperacion.find((b) => b.id === Number(botId)) : undefined;

  return (
    <div>
      <PageHeader
        back={elegido ? { href: `/dashboard/bots/${elegido.id}`, label: elegido.nombre } : { href: "/dashboard/incidencias", label: "Incidencias" }}
        title="Nueva incidencia"
        description="Su SLA corre desde que se registra."
      />
      <div className="mt-8">
        <IncidenciaForm bots={enOperacion} botId={elegido?.id} users={users ?? []} defaultResponsableId={user?.id} />
      </div>
    </div>
  );
}
