"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, RotateCcw, UserCheck, UserX } from "lucide-react";
import { sileo } from "sileo";
import { EliminarButton } from "@/components/comercial/eliminar-button";
import { PermisosMatriz } from "@/components/usuarios/permisos-matriz";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { MODULOS, ROLES, type Modulo, type Nivel } from "@/lib/permisos";
import { panelFetch } from "@/lib/panel-api";
import type { RolPreset, UserDetail } from "@/lib/users-schema";

type Permisos = Record<Modulo, Nivel>;

const iguales = (a: Permisos, b: Permisos) => MODULOS.every((m) => a[m.value] === b[m.value]);

// Everything an admin manages about one user. Each card saves on its own;
// permission changes apply to the user's session within seconds.
export function UsuarioEditor({ user, roles, esPropio }: { user: UserDetail; roles: RolPreset[]; esPropio: boolean }) {
  const router = useRouter();
  const presetDe = (rol: string) => roles.find((r) => r.rol === rol)?.permisos ?? user.permisosRol;

  const [nombre, setNombre] = useState(user.fullName);
  const [rol, setRol] = useState(user.role);
  const [permisos, setPermisos] = useState<Permisos>(user.permisosEfectivos);
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState<string | null>(null);

  const base = presetDe(rol);
  const esAdminRol = rol === "Admin";
  const permisosCambiados = rol !== user.role || !iguales(permisos, user.permisosEfectivos);
  const input = `${INPUT_BASE} ${inputState(false)}`;

  async function guardar(que: string, body: Record<string, unknown>, exito: string) {
    setEnviando(que);
    const result = await panelFetch<UserDetail>(`users/${user.id}`, { method: "PATCH", body });
    setEnviando(null);
    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar", description: result.message });
      return false;
    }
    sileo.success({ title: exito });
    router.refresh();
    return true;
  }

  function cambiarRol(nuevo: string) {
    setRol(nuevo);
    // A new role starts from its own preset.
    setPermisos(presetDe(nuevo));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className={`${CARD} min-w-0 p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink-950">Rol y permisos</h2>
            <p className="mt-1 text-sm text-ink-500">El rol trae sus permisos; puedes subir o bajar cualquier módulo solo para esta persona.</p>
          </div>
          {!esAdminRol && !iguales(permisos, base) && (
            <button type="button" onClick={() => setPermisos(base)} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
              <RotateCcw className="h-3.5 w-3.5" />
              Volver a los del rol
            </button>
          )}
        </div>

        <Field id="ue-rol" label="Rol" className="mt-5 max-w-sm">
          <select id="ue-rol" value={rol} onChange={(e) => cambiarRol(e.target.value)} disabled={esPropio && user.role === "Admin"} className={input}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <p className="mt-1.5 text-xs text-ink-500">{ROLES.find((r) => r.value === rol)?.ayuda}</p>

        <div className="mt-4 border-t border-line">
          {esAdminRol ? (
            <p className="py-4 text-sm text-ink-500">Un administrador tiene acceso total a todos los módulos; no se ajusta por módulo.</p>
          ) : (
            <PermisosMatriz valores={permisos} base={base} onChange={(m, n) => setPermisos((p) => ({ ...p, [m]: n }))} />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
          {permisosCambiados && (
            <button
              type="button"
              onClick={() => {
                setRol(user.role);
                setPermisos(user.permisosEfectivos);
              }}
              className={BUTTON_SECONDARY}
            >
              Descartar
            </button>
          )}
          <button
            type="button"
            disabled={!permisosCambiados || enviando !== null}
            onClick={() => guardar("permisos", { role: rol, permisos: esAdminRol ? {} : permisos }, "Permisos guardados")}
            className={BUTTON_PRIMARY}
          >
            {enviando === "permisos" && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar rol y permisos
          </button>
        </div>
      </section>

      <div className="flex min-w-0 flex-col gap-6">
        <section className={`${CARD} p-5`}>
          <h2 className="text-base font-semibold text-ink-950">Perfil</h2>
          <Field id="ue-nombre" label="Nombre completo" className="mt-3">
            <input id="ue-nombre" value={nombre} maxLength={200} onChange={(e) => setNombre(e.target.value)} className={input} />
          </Field>
          <p className="mt-3 text-sm text-ink-500">
            Correo: <span className="text-ink-950">{user.email}</span>
          </p>
          <button
            type="button"
            disabled={nombre.trim().length < 2 || nombre.trim() === user.fullName || enviando !== null}
            onClick={() => guardar("nombre", { fullName: nombre.trim() }, "Nombre actualizado")}
            className={`${BUTTON_SECONDARY} mt-4 w-full`}
          >
            {enviando === "nombre" && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar nombre
          </button>
        </section>

        <section className={`${CARD} p-5`}>
          <h2 className="text-base font-semibold text-ink-950">Acceso</h2>
          <p className="mt-1 text-sm text-ink-500">
            {user.activo
              ? "Puede ingresar al panel. Desactivarlo cierra sus sesiones al instante; su nombre queda en todo lo que hizo."
              : "Desactivado: no puede ingresar. Lo que hizo sigue con su nombre."}
          </p>
          {user.activo ? (
            <button
              type="button"
              disabled={esPropio || enviando !== null}
              onClick={() => window.confirm(`¿Desactivar a ${user.fullName}? No podrá ingresar hasta que lo reactives.`) && guardar("activo", { activo: false }, "Usuario desactivado")}
              className={`${BUTTON_SECONDARY} mt-4 w-full`}
              title={esPropio ? "No puedes desactivar tu propio usuario." : undefined}
            >
              {enviando === "activo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
              Desactivar usuario
            </button>
          ) : (
            <button type="button" disabled={enviando !== null} onClick={() => guardar("activo", { activo: true }, "Usuario reactivado")} className={`${BUTTON_PRIMARY} mt-4 w-full`}>
              {enviando === "activo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              Reactivar usuario
            </button>
          )}
        </section>

        <section className={`${CARD} p-5`}>
          <h2 className="text-base font-semibold text-ink-950">Contraseña</h2>
          <p className="mt-1 text-sm text-ink-500">Define una temporal si la olvidó; luego la cambia en Mi cuenta.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (clave.length < 8) return;
              if (await guardar("clave", { newPassword: clave }, "Contraseña temporal definida")) setClave("");
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <label htmlFor="ue-clave" className="sr-only">
              Contraseña temporal
            </label>
            <input id="ue-clave" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={clave} onChange={(e) => setClave(e.target.value)} className={input} />
            <button type="submit" disabled={clave.length < 8 || enviando !== null} className={BUTTON_SECONDARY}>
              {enviando === "clave" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Definir contraseña
            </button>
          </form>
        </section>

        {!esPropio && (
          <section className={`${CARD} p-5`}>
            <h2 className="text-base font-semibold text-ink-950">Eliminar</h2>
            <p className="mt-1 text-sm text-ink-500">Prefiere desactivarlo: eliminarlo deja su historial como “Usuario eliminado”.</p>
            <div className="mt-3 [&_button]:px-0">
              <EliminarButton
                path={`users/${user.id}`}
                confirmText={`¿Eliminar a ${user.fullName}? Su historial quedará como “Usuario eliminado”. Esta acción no se puede deshacer.`}
                redirectTo="/dashboard/usuarios"
                successTitle="Usuario eliminado"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
