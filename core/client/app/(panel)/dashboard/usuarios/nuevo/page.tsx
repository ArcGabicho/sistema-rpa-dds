import { CreateUserForm } from "@/components/sections/create-user-form";

export default function NuevoUsuarioPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-950">Nuevo usuario</h1>
      <p className="mt-1 text-sm text-slate">
        Crea un acceso para un trabajador con la contraseña temporal que definas aquí.
      </p>

      <div className="mt-8">
        <CreateUserForm />
      </div>
    </div>
  );
}
