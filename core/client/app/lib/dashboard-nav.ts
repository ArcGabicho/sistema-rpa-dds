import { LayoutDashboard, Rocket, UserCog, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/dashboard/clientes", icon: Users },
  { label: "Implementaciones", href: "/dashboard/implementaciones", icon: Rocket },
  { label: "Usuarios", href: "/dashboard/usuarios", icon: UserCog, adminOnly: true },
];
