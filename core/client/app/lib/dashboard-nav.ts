import { Building2, ClipboardList, FileText, FolderKanban, Inbox, SquareKanban, LayoutDashboard, UserCog, Vault } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

// The sidebar, one group per module. A group without a title sits at the top.
export type DashboardNavGroup = {
  title?: string;
  items: DashboardNavItem[];
};

export const DASHBOARD_NAV: DashboardNavGroup[] = [
  { items: [{ label: "Resumen", href: "/dashboard", icon: LayoutDashboard }] },
  {
    title: "Comercial",
    items: [
      { label: "Oportunidades", href: "/dashboard/oportunidades", icon: SquareKanban },
      { label: "Diagnósticos", href: "/dashboard/diagnosticos", icon: ClipboardList },
      { label: "Propuestas", href: "/dashboard/propuestas", icon: FileText },
      { label: "Empresas", href: "/dashboard/empresas", icon: Building2 },
      { label: "Solicitudes web", href: "/dashboard/solicitudes", icon: Inbox },
    ],
  },
  {
    title: "Entrega",
    items: [
      { label: "Proyectos", href: "/dashboard/proyectos", icon: FolderKanban },
      { label: "Bóveda", href: "/dashboard/boveda", icon: Vault },
    ],
  },
  {
    title: "Administración",
    items: [{ label: "Usuarios", href: "/dashboard/usuarios", icon: UserCog, adminOnly: true }],
  },
];
