import { RequiereModulo } from "@/components/permisos/requiere";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequiereModulo modulo="comercial">
      {children}
    </RequiereModulo>
  );
}
