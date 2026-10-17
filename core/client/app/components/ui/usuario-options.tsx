import type { TeamUser } from "@/lib/comercial";

// The team for an assignee <select>: active users, plus the one already
// assigned if they were deactivated since — so the select still shows them
// and saving the form doesn't silently reassign the work.
export function UsuarioOptions({ users, actual }: { users: TeamUser[]; actual?: number | null }) {
  return users
    .filter((u) => u.activo !== false || u.id === actual)
    .map((u) => (
      <option key={u.id} value={u.id}>
        {u.fullName}
        {u.activo === false ? " (desactivado)" : ""}
      </option>
    ));
}
