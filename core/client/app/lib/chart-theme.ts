// The palette tokens from globals.css as hex values: recharts draws SVG and
// takes colors as props, not Tailwind classes.
export const CHART = {
  brand700: "#0857a0",
  brand600: "#2080d9",
  brand500: "#359cfd",
  brand400: "#68a7df",
  brand300: "#9dcaf1",
  brand200: "#c8e5fe",
  glow400: "#70d9ff",
  ink950: "#17273a",
  ink500: "#5b7a96",
  ink400: "#8ea7bd",
  line: "#d9e0e6",
} as const;

export const AXIS_TICK = { fill: CHART.ink500, fontSize: 12 };

// Prioritization quadrants (diagnosis): the more urgent, the deeper the blue.
export const CUADRANTE_COLORES: Record<string, string> = {
  quick_win: CHART.brand700,
  estrategico: CHART.brand500,
  mejora_menor: "#94e2ff",
  postergar: CHART.ink400,
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "2026-05" -> "may" (or "may 2026" when asked for the year).
export function mesCorto(mes: string, conAnio = false) {
  const [anio, numero] = mes.split("-");
  const nombre = MESES[Number(numero) - 1] ?? mes;
  return conAnio ? `${nombre} ${anio}` : nombre;
}

// Axis labels: "S/ 85k", "S/ 1.2M". Formatted by hand so server and browser agree.
export function solesCompacto(value: number) {
  if (value >= 1_000_000) return `S/ ${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `S/ ${Math.round(value / 1_000)}k`;
  return `S/ ${Math.round(value)}`;
}
