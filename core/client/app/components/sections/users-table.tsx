"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { sileo } from "sileo";
import { ROLE_OPTIONS, type User } from "@/lib/users-schema";

function formatDate(value: string | null) {
  if (!value) return "Nunca";
  return new Date(value).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function UsersTable({ users, currentUserId }: { users: User[]; currentUserId: number }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);

  async function handleRoleChange(user: User, role: string) {
    setPendingId(user.id);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        sileo.error({ title: "No se pudo actualizar el rol", description: data?.message ?? "Intenta de nuevo." });
        return;
      }

      sileo.success({ title: "Rol actualizado" });
      router.refresh();
    } catch {
      sileo.error({ title: "No se pudo actualizar el rol", description: "Ocurrió un error de conexión." });
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(user: User) {
    if (!window.confirm(`¿Eliminar a ${user.fullName}? Esta acción no se puede deshacer.`)) return;

    setPendingId(user.id);
    try {
      const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        sileo.error({ title: "No se pudo eliminar", description: data?.message ?? "Intenta de nuevo." });
        return;
      }

      sileo.success({ title: "Usuario eliminado" });
      router.refresh();
    } catch {
      sileo.error({ title: "No se pudo eliminar", description: "Ocurrió un error de conexión." });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper">
      {/* Mobile: stacked cards */}
      <ul className="divide-y divide-line sm:hidden">
        {users.map((user) => (
          <li key={user.id} className="flex flex-col gap-3 p-5">
            <div>
              <p className="font-medium text-ink-950">{user.fullName}</p>
              <p className="text-sm text-slate">{user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={user.role}
                disabled={pendingId === user.id}
                onChange={(e) => handleRoleChange(user, e.target.value)}
                className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink-950"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {user.id !== currentUserId && (
                <button
                  type="button"
                  onClick={() => handleDelete(user)}
                  disabled={pendingId === user.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              )}
            </div>
            <p className="text-xs text-slate/80">Último ingreso: {formatDate(user.lastLoginAtUtc)}</p>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-mist/60 text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-6 py-3 font-medium">Nombre</th>
              <th className="px-6 py-3 font-medium">Correo</th>
              <th className="px-6 py-3 font-medium">Rol</th>
              <th className="px-6 py-3 font-medium">Último ingreso</th>
              <th className="px-6 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 font-medium text-ink-950">{user.fullName}</td>
                <td className="px-6 py-4 text-slate">{user.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    disabled={pendingId === user.id}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink-950"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate">{formatDate(user.lastLoginAtUtc)}</td>
                <td className="px-6 py-4 text-right">
                  {user.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(user)}
                      disabled={pendingId === user.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
