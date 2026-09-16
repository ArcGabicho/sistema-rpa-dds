import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-950">
        Bienvenido{user?.name ? `, ${user.name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-slate">
        Este es el resumen general de tu panel.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-paper p-8 text-sm text-slate">
        Este panel está en construcción.
      </div>
    </div>
  );
}
