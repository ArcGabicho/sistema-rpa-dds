export type CaseStudy = {
  title: string;
  tags: string[];
  teaser: string;
};

const SHARED_TEASER =
  "Desde bots que automatizan tareas hasta modelos que entienden el lenguaje y predicen comportamientos, en DDS implementamos soluciones inteligentes que reducen costos y agilizan procesos.";

export const CASE_STUDIES: CaseStudy[] = [
  {
    title: "Transformando procesos con RPA",
    tags: ["RPA"],
    teaser: SHARED_TEASER,
  },
  {
    title: "Optimizando las ventas con OCR + RPA",
    tags: ["OCR", "RPA"],
    teaser: SHARED_TEASER,
  },
  {
    title: "Acelerando la toma de decisiones con analítica",
    tags: ["Analítica"],
    teaser: SHARED_TEASER,
  },
  {
    title: "Impulsando decisiones con soporte BI",
    tags: ["Analítica"],
    teaser: SHARED_TEASER,
  },
];
