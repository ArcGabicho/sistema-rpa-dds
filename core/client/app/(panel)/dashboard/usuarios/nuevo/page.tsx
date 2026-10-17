import { NuevoUsuarioForm } from "@/components/usuarios/nuevo-usuario-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { RolPreset } from "@/lib/users-schema";

export default async function NuevoUsuarioPage() {
  const roles = await apiGet<RolPreset[]>("users/roles");

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/usuarios", label: "Usuarios" }}
        title="Nuevo usuario"
        description="Un acceso al panel para alguien del equipo, con una contraseña temporal."
      />
      <div className="mt-8">
        <NuevoUsuarioForm roles={roles ?? []} />
      </div>
    </div>
  );
}
