import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateUserForm } from "@/components/sections/create-user-form";

export default function NuevoUsuarioPage() {
  return (
    <div>
      <Link
        href="/dashboard/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Usuarios
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
        Nuevo usuario
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Crea un acceso para un trabajador con la contraseña temporal que definas aquí.
      </p>

      <div className="mt-8">
        <CreateUserForm />
      </div>
    </div>
  );
}
