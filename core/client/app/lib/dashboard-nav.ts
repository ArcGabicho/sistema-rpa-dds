import { LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboard },
];
