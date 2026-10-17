import { Bot, Building2, CalendarClock, ClipboardList, FileText, FolderKanban, Inbox, LifeBuoy, SquareKanban, LayoutDashboard, UserCog, Vault } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Modulo } from "@/lib/permisos";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  // Shown to users who can at least see this module.
  modulo?: Modulo;
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
      { label: "Oportunidades", href: "/dashboard/oportunidades", icon: SquareKanban, modulo: "comercial" },
      { label: "Diagnósticos", href: "/dashboard/diagnosticos", icon: ClipboardList, modulo: "diagnosticos" },
      { label: "Propuestas", href: "/dashboard/propuestas", icon: FileText, modulo: "propuestas" },
      { label: "Empresas", href: "/dashboard/empresas", icon: Building2, modulo: "comercial" },
      { label: "Solicitudes web", href: "/dashboard/solicitudes", icon: Inbox, modulo: "comercial" },
    ],
  },
  {
    title: "Entrega",
    items: [
      { label: "Proyectos", href: "/dashboard/proyectos", icon: FolderKanban, modulo: "proyectos" },
      { label: "Bóveda", href: "/dashboard/boveda", icon: Vault, modulo: "boveda" },
    ],
  },
  {
    title: "Operación",
    items: [
      { label: "Bots", href: "/dashboard/bots", icon: Bot, modulo: "operacion" },
      { label: "Incidencias", href: "/dashboard/incidencias", icon: LifeBuoy, modulo: "operacion" },
      { label: "Vencimientos", href: "/dashboard/vencimientos", icon: CalendarClock, modulo: "operacion" },
    ],
  },
  {
    title: "Administración",
    items: [{ label: "Usuarios", href: "/dashboard/usuarios", icon: UserCog, adminOnly: true }],
  },
];
