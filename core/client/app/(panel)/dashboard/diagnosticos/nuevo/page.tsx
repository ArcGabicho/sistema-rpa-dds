import { NuevoDiagnosticoForm } from "@/components/diagnostico/nuevo-diagnostico-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { Empresa, Oportunidad, TeamUser } from "@/lib/comercial";
import { getSessionUser } from "@/lib/session";

// ?oportunidadId= (from the opportunity's page) or ?empresaId= preset the client.
export default async function NuevoDiagnosticoPage({
  searchParams,
}: {
  searchParams: Promise<{ oportunidadId?: string; empresaId?: string }>;
}) {
  const { oportunidadId, empresaId } = await searchParams;
  const valido = (v?: string) => !!v && /^\d+$/.test(v);
  const [users, user, oportunidad, empresa] = await Promise.all([
    apiGet<TeamUser[]>("users"),
    getSessionUser(),
    valido(oportunidadId) ? apiGet<Oportunidad>(`oportunidades/${oportunidadId}`) : null,
    valido(empresaId) ? apiGet<Empresa>(`empresas/${empresaId}`) : null,
  ]);

  return (
    <div>
      <PageHeader
        back={
          oportunidad
            ? { href: `/dashboard/oportunidades/${oportunidad.id}`, label: oportunidad.titulo }
            : { href: "/dashboard/diagnosticos", label: "Diagnósticos" }
        }
        title="Nuevo diagnóstico"
        description="Después agregas los procesos que levantes con el cliente; el ahorro y el retorno se calculan solos."
      />
      <div className="mt-8">
        <NuevoDiagnosticoForm
          oportunidad={
            oportunidad
              ? { id: oportunidad.id, titulo: oportunidad.titulo, empresaId: oportunidad.empresaId, empresaNombre: oportunidad.empresaNombre }
              : undefined
          }
          empresa={empresa ? { id: empresa.id, nombreComercial: empresa.nombreComercial, ruc: empresa.ruc } : undefined}
          users={users ?? []}
          defaultResponsableId={user?.id}
        />
      </div>
    </div>
  );
}
