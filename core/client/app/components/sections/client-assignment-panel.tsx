"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { UsuarioOptions } from "@/components/ui/usuario-options";

const STATUS_OPTIONS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "cerrado", label: "Cerrado" },
];

const FIELD_BASE =
  "h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink-950 outline-none transition-colors focus:border-brand-500 disabled:opacity-60";

export function ClientAssignmentPanel({
  clientId,
  status,
  assignedToUserId,
  users,
}: {
  clientId: number;
  status: string;
  assignedToUserId: number | null;
  users: { id: number; fullName: string; activo?: boolean }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function update(nextStatus: string, nextAssignedToUserId: number | null) {
    setSaving(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, assignedToUserId: nextAssignedToUserId }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        sileo.error({ title: "No se pudo actualizar", description: data?.message ?? "Intenta de nuevo." });
        return;
      }

      sileo.success({ title: "Lead actualizado" });
      router.refresh();
    } catch {
      sileo.error({ title: "No se pudo actualizar", description: "Ocurrió un error de conexión." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="h-fit rounded-lg bg-white shadow-card p-6">
      <h2 className="text-base font-semibold text-ink-950">Seguimiento</h2>
      <div className="mt-4 flex flex-col gap-4">
        <div>
          <label htmlFor="client-status" className="mb-1.5 block text-sm font-medium text-ink-950">
            Estado
          </label>
          <select
            id="client-status"
            value={status}
            disabled={saving}
            onChange={(e) => update(e.target.value, assignedToUserId)}
            className={FIELD_BASE}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="client-assignee" className="mb-1.5 block text-sm font-medium text-ink-950">
            Asignado a
          </label>
          <select
            id="client-assignee"
            value={assignedToUserId ?? ""}
            disabled={saving}
            onChange={(e) => update(status, e.target.value ? Number(e.target.value) : null)}
            className={FIELD_BASE}
          >
            <option value="">Sin asignar</option>
            <UsuarioOptions users={users} actual={assignedToUserId} />
          </select>
        </div>
      </div>
    </aside>
  );
}
