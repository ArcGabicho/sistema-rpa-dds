import {
  Building2,
  GraduationCap,
  Hotel,
  Landmark,
  Pickaxe,
  ShieldCheck,
  ShoppingCart,
  Server,
  Stethoscope,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Industry = {
  name: string;
  description: string;
  icon: LucideIcon;
};

export const INDUSTRIES: Industry[] = [
  {
    name: "Educación",
    description: "Automatizamos procesos académicos, financieros y administrativos.",
    icon: GraduationCap,
  },
  {
    name: "Hotelería y Turismo",
    description: "Optimizamos cierres de caja, reservas y validación de documentos.",
    icon: Hotel,
  },
  {
    name: "Banca y Finanzas",
    description: "Reducimos carga operativa y riesgos mediante automatización y analítica.",
    icon: Landmark,
  },
  {
    name: "Salud",
    description: "Simplificamos la gestión clínica y documental con IA y RPA.",
    icon: Stethoscope,
  },
  {
    name: "Retail y Consumo Masivo",
    description: "Transformamos la cadena comercial con datos en tiempo real.",
    icon: ShoppingCart,
  },
  {
    name: "Logística y Transporte",
    description: "Mejoramos la trazabilidad y planificación operativa.",
    icon: Truck,
  },
  {
    name: "Seguros",
    description: "Agilizamos la validación de pólizas y atención al cliente.",
    icon: ShieldCheck,
  },
  {
    name: "Minería",
    description: "Automatizamos reportes operativos y seguimiento de indicadores.",
    icon: Pickaxe,
  },
  {
    name: "Sector Público",
    description: "Aplicamos IA para convocatorias, revisión documental y transparencia.",
    icon: Building2,
  },
  {
    name: "Servicios Tecnológicos",
    description: "Complementamos equipos TI con RPA, dashboards y agentes IA.",
    icon: Server,
  },
];
