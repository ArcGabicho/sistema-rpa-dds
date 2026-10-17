import { notFound } from "next/navigation";
import { UsuarioEditor } from "@/components/usuarios/usuario-editor";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import { formatDate } from "@/lib/format-date";
import { ROL_LABELS } from "@/lib/permisos";
import { getMe } from "@/lib/session";
import type { RolPreset, UserDetail } from "@/lib/users-schema";

export default async function UsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [user, roles, { me }] = await Promise.all([apiGet<UserDetail>(`users/${id}`), apiGet<RolPreset[]>("users/roles"), getMe()]);
  if (!user) notFound();

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/usuarios", label: "Usuarios" }}
        title={user.fullName}
        badges={
          <>
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">{ROL_LABELS[user.role] ?? user.role}</span>
            {!user.activo && <span className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs font-medium text-ink-500">Desactivado</span>}
          </>
        }
        description={`${user.email} · Creado el ${formatDate(user.createdAtUtc)} · ${user.lastLoginAtUtc ? `último ingreso el ${formatDate(user.lastLoginAtUtc)}` : "aún no ingresa"}`}
      />
      <div className="mt-8">
        <UsuarioEditor key={`${user.role}-${user.activo}`} user={user} roles={roles ?? []} esPropio={user.id === me?.id} />
      </div>
    </div>
  );
}
