import { OportunidadForm } from "@/components/comercial/oportunidad-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { Empresa, TeamUser } from "@/lib/comercial";
import { getSessionUser } from "@/lib/session";

// ?empresaId= presets the company (the "Nueva oportunidad" link on its page).
export default async function NuevaOportunidadPage({
  searchParams,
}: {
  searchParams: Promise<{ empresaId?: string }>;
}) {
  const { empresaId } = await searchParams;
  const [users, user, empresa] = await Promise.all([
    apiGet<TeamUser[]>("users"),
    getSessionUser(),
    empresaId && /^\d+$/.test(empresaId) ? apiGet<Empresa>(`empresas/${empresaId}`) : null,
  ]);

  return (
    <div>
      <PageHeader
        back={
          empresa
            ? { href: `/dashboard/empresas/${empresa.id}`, label: empresa.nombreComercial }
            : { href: "/dashboard/oportunidades", label: "Oportunidades" }
        }
        title="Nueva oportunidad"
        description="Una necesidad concreta de un cliente que DDS puede resolver."
      />
      <div className="mt-8">
        <OportunidadForm empresa={empresa ?? undefined} users={users ?? []} defaultResponsableId={user?.id} />
      </div>
    </div>
  );
}
