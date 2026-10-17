import { CambiarClaveForm } from "@/components/usuarios/cambiar-clave-form";
import { PermisosMatriz } from "@/components/usuarios/permisos-matriz";
import { PageHeader } from "@/components/ui/page-header";
import { CARD } from "@/components/ui/panel-styles";
import { ROLES } from "@/lib/permisos";
import { getMe } from "@/lib/session";

export default async function CuentaPage() {
  const { me } = await getMe();
  if (!me) return <p className={`${CARD} p-6 text-sm text-ink-500`}>No se pudo cargar tu cuenta. Intenta de nuevo más tarde.</p>;

  return (
    <div>
      <PageHeader title="Mi cuenta" description={`${me.fullName} · ${me.email}`} />
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className={`${CARD} min-w-0 p-6`}>
          <h2 className="text-base font-semibold text-ink-950">Lo que puedes hacer</h2>
          <p className="mt-1 text-sm text-ink-500">
            Rol <span className="font-medium text-ink-950">{me.roleLabel}</span>. {ROLES.find((r) => r.value === me.role)?.ayuda} Si necesitas otro acceso,
            pídeselo a un administrador.
          </p>
          <div className="mt-4 border-t border-line">
            <PermisosMatriz valores={me.permisos} />
          </div>
        </section>
        <section className={`${CARD} p-6`}>
          <h2 className="text-base font-semibold text-ink-950">Cambiar contraseña</h2>
          <div className="mt-4">
            <CambiarClaveForm />
          </div>
        </section>
      </div>
    </div>
  );
}
