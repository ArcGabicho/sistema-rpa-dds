import { notFound } from "next/navigation";
import { OportunidadForm } from "@/components/comercial/oportunidad-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { Oportunidad, TeamUser } from "@/lib/comercial";

export default async function EditarOportunidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [oportunidad, users] = await Promise.all([apiGet<Oportunidad>(`oportunidades/${id}`), apiGet<TeamUser[]>("users")]);
  if (!oportunidad) notFound();

  return (
    <div>
      <PageHeader
        back={{ href: `/dashboard/oportunidades/${oportunidad.id}`, label: oportunidad.titulo }}
        title="Editar oportunidad"
      />
      <div className="mt-8">
        <OportunidadForm oportunidad={oportunidad} users={users ?? []} />
      </div>
    </div>
  );
}
