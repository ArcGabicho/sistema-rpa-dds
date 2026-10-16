import { Building2, Inbox, SquareKanban, LayoutDashboard, UserCog } from "lucide-react";
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
      { label: "Empresas", href: "/dashboard/empresas", icon: Building2 },
      { label: "Solicitudes web", href: "/dashboard/solicitudes", icon: Inbox },
    ],
  },
  {
    title: "Administración",
    items: [{ label: "Usuarios", href: "/dashboard/usuarios", icon: UserCog, adminOnly: true }],
  },
];
