import Link from "next/link";
import { ChevronRight, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { BUTTON_PRIMARY, CARD } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import { formatDate } from "@/lib/format-date";
import { ROL_LABELS } from "@/lib/permisos";
import { getMe } from "@/lib/session";
import type { User } from "@/lib/users-schema";

function RolBadge({ user }: { user: User }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">{ROL_LABELS[user.role] ?? user.role}</span>
      {user.personalizado && <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-ink-500">Ajustado</span>}
    </span>
  );
}

export default async function UsuariosPage() {
  const [users, { me }] = await Promise.all([apiGet<User[]>("users"), getMe()]);
  const grupos = [
    { titulo: "Activos", lista: users?.filter((u) => u.activo) ?? [] },
    { titulo: "Desactivados", lista: users?.filter((u) => !u.activo) ?? [] },
  ].filter((g) => g.lista.length > 0);

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Quién entra al panel, con qué rol y qué puede hacer en cada módulo."
        actions={
          <Link href="/dashboard/usuarios/nuevo" className={BUTTON_PRIMARY}>
            <UserPlus className="h-4 w-4" />
            Nuevo usuario
          </Link>
        }
      />

      {!users ? (
        <p className={`${CARD} mt-8 p-6 text-sm text-ink-500`}>No se pudieron cargar los usuarios. Intenta de nuevo más tarde.</p>
      ) : (
        grupos.map(({ titulo, lista }, i) => (
            <section key={titulo} className={`${CARD} ${i === 0 ? "mt-8" : "mt-6"} overflow-hidden`}>
              <h2 className="p-5 text-base font-semibold text-ink-950">
                {titulo} <span className="font-normal text-ink-500">{lista.length}</span>
              </h2>
              <ul className="divide-y divide-line border-t border-line">
                {lista.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/dashboard/usuarios/${u.id}`}
                      className="group grid gap-2 px-5 py-3.5 hover:bg-brand-50 sm:grid-cols-[minmax(0,1fr)_12rem_9rem_auto] sm:items-center sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className={`truncate font-medium group-hover:underline ${u.activo ? "text-ink-950" : "text-ink-500"}`}>
                          {u.fullName}
                          {u.id === me?.id && <span className="ml-2 text-xs font-normal text-ink-400">(tú)</span>}
                        </p>
                        <p className="truncate text-xs text-ink-500">{u.email}</p>
                      </div>
                      <RolBadge user={u} />
                      <p className="text-xs text-ink-500">{u.lastLoginAtUtc ? `Ingresó el ${formatDate(u.lastLoginAtUtc)}` : "Aún no ingresa"}</p>
                      <ChevronRight className="hidden h-4 w-4 text-ink-400 sm:block" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}
