import { SinAcceso } from "@/components/permisos/sin-acceso";
import { puede, type Modulo, type Nivel } from "@/lib/permisos";
import { getMe } from "@/lib/session";

// Guards a route segment (used from its layout.tsx): without the access,
// the page isn't rendered at all. The API enforces the same rules; this
// only spares the user a page full of errors. When the API can't be
// reached the page renders and shows its own error.
export async function RequiereModulo({ modulo, nivel = "ver", children }: { modulo: Modulo; nivel?: Nivel; children: React.ReactNode }) {
  const { me } = await getMe();
  if (me && !puede(me, modulo, nivel)) return <SinAcceso modulo={modulo} nivel={nivel} />;
  return children;
}

// Admin-only sections fail closed: without an answer from the API, no page.
export async function RequiereAdmin({ children }: { children: React.ReactNode }) {
  const { me } = await getMe();
  if (!me?.esAdmin) return <SinAcceso soloAdmin />;
  return children;
}
