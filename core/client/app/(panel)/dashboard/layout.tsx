import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SesionInvalida } from "@/components/permisos/sesion-invalida";
import { getMe, getSessionUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, { me, sesionInvalida }] = await Promise.all([getSessionUser(), getMe()]);
  // Deactivated or deleted since signing in: the token is still valid, the user isn't.
  if (sesionInvalida) return <SesionInvalida />;

  return (
    <DashboardShell user={user} me={me}>
      {children}
    </DashboardShell>
  );
}
