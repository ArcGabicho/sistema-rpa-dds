import {
  Award,
  Handshake,
  Headphones,
  History,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type WhyChooseItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const WHY_CHOOSE: WhyChooseItem[] = [
  {
    icon: History,
    title: "Experiencia y Solidez",
    description:
      "Más de 10 años impulsando la transformación digital de empresas peruanas mediante soluciones comprobadas en sectores como hotelería, educación, retail y finanzas.",
  },
  {
    icon: TrendingUp,
    title: "Inteligencia Comercial Estratégica",
    description:
      "Aplicamos analítica avanzada para optimizar campañas y maximizar el retorno, con una visión enfocada en el negocio.",
  },
  {
    icon: Headphones,
    title: "Cercanía y Soporte Personalizado",
    description:
      "Atención directa y asesoría continua en cada etapa del proyecto, sin intermediarios.",
  },
  {
    icon: Award,
    title: "Certificación y Especialización",
    description:
      "Profesionales alineados a estándares internacionales, con conocimiento práctico del mercado local.",
  },
  {
    icon: PiggyBank,
    title: "Ahorro y Eficiencia Operativa",
    description:
      "Automatizamos tareas repetitivas, reducimos errores y liberamos tiempo clave para que tu equipo se enfoque en lo estratégico.",
  },
  {
    icon: Handshake,
    title: "Transparencia y Confianza",
    description:
      "Mantenemos relaciones honestas, claras y sostenibles, construidas sobre acuerdos justos.",
  },
];
