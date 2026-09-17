"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";

const STATUS_OPTIONS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "cerrado", label: "Cerrado" },
];

const FIELD_BASE =
  "w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink-950 outline-none transition-colors focus:border-brass-400";

export function ClientAssignmentPanel({
  clientId,
  status,
  assignedToUserId,
  users,
}: {
  clientId: number;
  status: string;
  assignedToUserId: number | null;
  users: { id: number; fullName: string }[];
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
    <div className="rounded-2xl border border-line bg-paper p-6">
      <p className="font-display text-sm font-bold text-ink-950">Seguimiento</p>
      <div className="mt-4 flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Estado</label>
          <select
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
          <label className="mb-1.5 block text-sm font-medium text-ink-950">Asignado a</label>
          <select
            value={assignedToUserId ?? ""}
            disabled={saving}
            onChange={(e) => update(status, e.target.value ? Number(e.target.value) : null)}
            className={FIELD_BASE}
          >
            <option value="">Sin asignar</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
