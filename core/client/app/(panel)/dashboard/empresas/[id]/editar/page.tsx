import { notFound } from "next/navigation";
import { EmpresaForm } from "@/components/comercial/empresa-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { Empresa, TeamUser } from "@/lib/comercial";

export default async function EditarEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [empresa, users] = await Promise.all([apiGet<Empresa>(`empresas/${id}`), apiGet<TeamUser[]>("users")]);
  if (!empresa) notFound();

  return (
    <div>
      <PageHeader back={{ href: `/dashboard/empresas/${empresa.id}`, label: empresa.nombreComercial }} title="Editar empresa" />
      <div className="mt-8">
        <EmpresaForm empresa={empresa} users={users ?? []} />
      </div>
    </div>
  );
}
