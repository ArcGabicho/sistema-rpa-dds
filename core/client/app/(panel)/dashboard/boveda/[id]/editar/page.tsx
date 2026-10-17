import { notFound, redirect } from "next/navigation";
import { SecretoForm } from "@/components/boveda/secreto-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { Secreto } from "@/lib/boveda";
import { getMe } from "@/lib/session";

export default async function EditarSecretoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [secreto, { me }] = await Promise.all([apiGet<Secreto>(`boveda/${id}`), getMe()]);
  if (!secreto) notFound();
  const esAdmin = me?.esAdmin === true;
  // Restricted secrets are only edited by admins (the API enforces it too).
  if (secreto.restringido && !esAdmin) redirect(`/dashboard/boveda/${secreto.id}`);

  return (
    <div>
      <PageHeader
        back={{ href: `/dashboard/boveda/${secreto.id}`, label: secreto.nombre }}
        title="Editar credencial"
        description="Para cambiar el valor, usa “Rotar valor” en la página de la credencial."
      />
      <div className="mt-8">
        <SecretoForm secreto={secreto} esAdmin={esAdmin} />
      </div>
    </div>
  );
}
