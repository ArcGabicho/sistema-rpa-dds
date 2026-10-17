import { UserX } from "lucide-react";
import { LogoutButton } from "@/components/sections/logout-button";
import { CARD } from "@/components/ui/panel-styles";

// The token still checks out but the API no longer accepts the user (they
// were deactivated or deleted): nothing to show but the way out.
export function SesionInvalida() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-50 px-4">
      <div className={`${CARD} w-full max-w-md p-8 text-center`}>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <UserX className="h-5 w-5" />
        </span>
        <h1 className="mt-4 font-display text-xl font-semibold text-ink-950">Tu sesión ya no es válida</h1>
        <p className="mt-2 text-sm text-ink-500">Tu usuario fue desactivado o eliminado. Si crees que es un error, habla con un administrador.</p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
