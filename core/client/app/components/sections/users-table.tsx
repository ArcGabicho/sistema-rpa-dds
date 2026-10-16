"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { sileo } from "sileo";
import { ROLE_OPTIONS, type User } from "@/lib/users-schema";
import { formatDate } from "@/lib/format-date";

const ROLE_SELECT =
  "h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm text-neutral-950 outline-none transition-colors focus:border-neutral-950 disabled:opacity-60";
const DELETE_BUTTON =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60";

function formatLastLogin(value: string | null) {
  return value ? formatDate(value) : "Nunca";
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
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      {/* Mobile: stacked rows */}
      <ul className="divide-y divide-neutral-200 sm:hidden">
        {users.map((user) => (
          <li key={user.id} className="flex flex-col gap-3 p-4">
            <div>
              <p className="font-medium text-neutral-950">{user.fullName}</p>
              <p className="text-sm text-neutral-500">{user.email}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <select
                value={user.role}
                disabled={pendingId === user.id}
                onChange={(e) => handleRoleChange(user, e.target.value)}
                aria-label={`Rol de ${user.fullName}`}
                className={ROLE_SELECT}
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
                  className={DELETE_BUTTON}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              )}
            </div>
            <p className="text-xs text-neutral-400">Último ingreso: {formatLastLogin(user.lastLoginAtUtc)}</p>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
            <tr>
              <th className="px-5 py-3 font-medium">Nombre</th>
              <th className="px-5 py-3 font-medium">Correo</th>
              <th className="px-5 py-3 font-medium">Rol</th>
              <th className="px-5 py-3 font-medium">Último ingreso</th>
              <th className="px-5 py-3 font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-3.5 font-medium text-neutral-950">
                  {user.fullName}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs font-normal text-neutral-400">(tú)</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-neutral-500">{user.email}</td>
                <td className="px-5 py-3.5">
                  <select
                    value={user.role}
                    disabled={pendingId === user.id}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    aria-label={`Rol de ${user.fullName}`}
                    className={ROLE_SELECT}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-neutral-500">
                  {formatLastLogin(user.lastLoginAtUtc)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {user.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(user)}
                      disabled={pendingId === user.id}
                      className={DELETE_BUTTON}
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
