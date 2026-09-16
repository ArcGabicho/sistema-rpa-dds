export type ProcessStep = {
  title: string;
  description: string;
};

export const PROCESS_STEPS: ProcessStep[] = [
  {
    title: "Descubrimiento y diagnóstico",
    description:
      "Analizamos tus procesos, fuentes de datos y puntos críticos. Identificamos qué se puede automatizar, visualizar o potenciar con IA.",
  },
  {
    title: "Soluciones a medida",
    description:
      "Diseñamos una solución personalizada con herramientas como Power BI, Qlik, Looker, Rocketbot o IA (modelos LLM), alineadas a tus objetivos y recursos.",
  },
  {
    title: "Diseño del roadmap",
    description:
      "Trazamos un plan claro por fases: desde pruebas y pilotos hasta escalamiento. Todo con documentación y seguimiento estratégico.",
  },
  {
    title: "Implementación y soporte continuo",
    description:
      "Automatizamos procesos, conectamos sistemas y activamos reportes inteligentes. Luego acompañamos con soporte técnico y mejoras evolutivas.",
  },
];
