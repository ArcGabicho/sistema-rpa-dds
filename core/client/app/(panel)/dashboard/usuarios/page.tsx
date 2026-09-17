import Link from "next/link";
import { UserPlus } from "lucide-react";
import { getApiUrl } from "@/lib/auth";
import { getSessionToken, getSessionUser } from "@/lib/session";
import { UsersTable } from "@/components/sections/users-table";
import type { User } from "@/lib/users-schema";

async function getUsers(): Promise<{ users: User[]; error: boolean }> {
  const token = await getSessionToken();
  if (!token) return { users: [], error: true };

  try {
    const response = await fetch(`${getApiUrl()}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) return { users: [], error: true };

    const users: User[] = await response.json();
    return { users, error: false };
  } catch {
    return { users: [], error: true };
  }
}

export default async function UsuariosPage() {
  const [{ users, error }, currentUser] = await Promise.all([getUsers(), getSessionUser()]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950">Usuarios</h1>
          <p className="mt-1 text-sm text-slate">
            Administra quién puede acceder al panel y con qué rol.
          </p>
        </div>
        <Link
          href="/dashboard/usuarios/nuevo"
          className="inline-flex items-center gap-2 rounded-full bg-brass-500 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brass-600"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo usuario
        </Link>
      </div>

      <div className="mt-8">
        {error ? (
          <p className="rounded-2xl border border-line bg-paper p-8 text-sm text-slate">
            No se pudieron cargar los usuarios. Intenta de nuevo más tarde.
          </p>
        ) : (
          <UsersTable users={users} currentUserId={currentUser?.id ?? 0} />
        )}
      </div>
    </div>
  );
}
