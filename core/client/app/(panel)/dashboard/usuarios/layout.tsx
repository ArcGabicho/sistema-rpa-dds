import { RequiereAdmin } from "@/components/permisos/requiere";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequiereAdmin>{children}</RequiereAdmin>;
}
