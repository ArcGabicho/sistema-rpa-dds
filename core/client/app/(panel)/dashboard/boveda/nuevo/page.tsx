import { SecretoForm } from "@/components/boveda/secreto-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { Empresa } from "@/lib/comercial";
import { getSessionUser, isAdmin } from "@/lib/session";

// ?empresaId= presets the company (the "Agregar" link on its page).
export default async function NuevoSecretoPage({ searchParams }: { searchParams: Promise<{ empresaId?: string }> }) {
  const { empresaId } = await searchParams;
  const [user, empresa] = await Promise.all([
    getSessionUser(),
    empresaId && /^\d+$/.test(empresaId) ? apiGet<Empresa>(`empresas/${empresaId}`) : null,
  ]);

  return (
    <div>
      <PageHeader
        back={
          empresa
            ? { href: `/dashboard/empresas/${empresa.id}`, label: empresa.nombreComercial }
            : { href: "/dashboard/boveda", label: "Bóveda" }
        }
        title="Nueva credencial"
        description="El valor se cifra antes de guardarse; nadie lo verá sin revelarlo, y cada vez queda registrado."
      />
      <div className="mt-8">
        <SecretoForm
          empresa={empresa ? { id: empresa.id, nombreComercial: empresa.nombreComercial, ruc: empresa.ruc } : undefined}
          esAdmin={isAdmin(user)}
        />
      </div>
    </div>
  );
}
