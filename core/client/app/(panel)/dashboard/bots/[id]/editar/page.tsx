import { notFound } from "next/navigation";
import { BotForm } from "@/components/operacion/bot-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { TeamUser } from "@/lib/comercial";
import { todayInLima } from "@/lib/format-date";
import type { Bot } from "@/lib/operacion";

export default async function EditarBotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bot, users] = await Promise.all([apiGet<Bot>(`bots/${id}`), apiGet<TeamUser[]>("users")]);
  if (!bot) notFound();

  return (
    <div>
      <PageHeader back={{ href: `/dashboard/bots/${bot.id}`, label: bot.nombre }} title="Editar bot" />
      <div className="mt-8">
        <BotForm bot={bot} users={users ?? []} today={todayInLima()} />
      </div>
    </div>
  );
}
