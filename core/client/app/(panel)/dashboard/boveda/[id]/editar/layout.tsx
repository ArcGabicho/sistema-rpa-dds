import { RequiereModulo } from "@/components/permisos/requiere";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequiereModulo modulo="boveda" nivel="editar">
      {children}
    </RequiereModulo>
  );
}
