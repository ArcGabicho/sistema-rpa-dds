export type CaseStudy = {
  title: string;
  tags: string[];
  // One-line summary of this specific case. Leave it out rather than
  // repeating a generic blurb: the list renders fine with title and tags.
  teaser?: string;
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    title: "Transformando procesos con RPA",
    tags: ["RPA"],
  },
  {
    title: "Optimizando las ventas con OCR + RPA",
    tags: ["OCR", "RPA"],
  },
  {
    title: "Acelerando la toma de decisiones con analítica",
    tags: ["Analítica"],
  },
  {
    title: "Impulsando decisiones con soporte BI",
    tags: ["Analítica"],
  },
];
