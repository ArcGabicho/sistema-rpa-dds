import { EmpresaForm } from "@/components/comercial/empresa-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { TeamUser } from "@/lib/comercial";

export default async function NuevaEmpresaPage() {
  const users = await apiGet<TeamUser[]>("users");

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/empresas", label: "Empresas" }}
        title="Nueva empresa"
        description="Solo el nombre es obligatorio; el resto puede completarse después."
      />
      <div className="mt-8">
        <EmpresaForm users={users ?? []} />
      </div>
    </div>
  );
}
