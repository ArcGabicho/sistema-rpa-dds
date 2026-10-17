import Link from "next/link";
import { Lock } from "lucide-react";
import { BUTTON_SECONDARY, CARD } from "@/components/ui/panel-styles";
import { MODULOS, type Modulo, type Nivel } from "@/lib/permisos";

// Shown instead of a page the user's permissions don't reach.
export function SinAcceso({ modulo, nivel, soloAdmin = false }: { modulo?: Modulo; nivel?: Nivel; soloAdmin?: boolean }) {
  const nombre = MODULOS.find((m) => m.value === modulo)?.label ?? "esta sección";
  const titulo = soloAdmin
    ? "Solo para administradores"
    : nivel === "editar"
      ? `Tu acceso a ${nombre} es de solo lectura`
      : `No tienes acceso a ${nombre}`;
  return (
    <div className={`${CARD} mx-auto mt-12 max-w-lg p-8 text-center`}>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <Lock className="h-5 w-5" />
      </span>
      <h1 className="mt-4 font-display text-xl font-semibold text-ink-950">{titulo}</h1>
      <p className="mt-2 text-sm text-ink-500">
        {soloAdmin ? "Esta sección la gestiona un administrador." : "Si lo necesitas para tu trabajo, pide a un administrador que ajuste tus permisos."}
      </p>
      <Link href="/dashboard" className={`${BUTTON_SECONDARY} mt-6`}>
        Volver al resumen
      </Link>
    </div>
  );
}
