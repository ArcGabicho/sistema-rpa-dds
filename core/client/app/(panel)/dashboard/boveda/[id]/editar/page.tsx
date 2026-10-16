import { notFound, redirect } from "next/navigation";
import { SecretoForm } from "@/components/boveda/secreto-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { Secreto } from "@/lib/boveda";
import { getSessionUser, isAdmin } from "@/lib/session";

export default async function EditarSecretoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [secreto, user] = await Promise.all([apiGet<Secreto>(`boveda/${id}`), getSessionUser()]);
  if (!secreto) notFound();
  // Restricted secrets are only edited by admins (the API enforces it too).
  if (secreto.restringido && !isAdmin(user)) redirect(`/dashboard/boveda/${secreto.id}`);

  return (
    <div>
      <PageHeader
        back={{ href: `/dashboard/boveda/${secreto.id}`, label: secreto.nombre }}
        title="Editar credencial"
        description="Para cambiar el valor, usa “Rotar valor” en la página de la credencial."
      />
      <div className="mt-8">
        <SecretoForm secreto={secreto} esAdmin={isAdmin(user)} />
      </div>
    </div>
  );
}
