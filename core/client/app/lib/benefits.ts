import { Gauge, LayoutDashboard, ShieldCheck, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Benefit = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const BENEFITS: Benefit[] = [
  {
    icon: Gauge,
    title: "Mejora la productividad",
    description:
      "Automatiza tareas repetitivas con bots RPA y enfoca a tu equipo en tareas de mayor valor.",
  },
  {
    icon: LayoutDashboard,
    title: "Decisiones con datos reales",
    description: "Centraliza y visualiza tu información más crucial con potentes dashboards.",
  },
  {
    icon: ShieldCheck,
    title: "Reduce errores",
    description:
      "Evita fallas manuales con validaciones automáticas y reglas de negocio integradas.",
  },
  {
    icon: Wallet,
    title: "Optimiza tu inversión en TI",
    description: "Implementa soluciones escalables, medibles y sin costos ocultos.",
  },
];
