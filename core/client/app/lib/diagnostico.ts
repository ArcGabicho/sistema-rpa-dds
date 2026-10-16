// Shared vocabulary of the diagnosis module, mirroring core/server/Models/Diagnostico.cs.

export const DIAGNOSTICO_ESTADOS = [
  { value: "en_curso", label: "En curso" },
  { value: "entregado", label: "Entregado" },
  { value: "archivado", label: "Archivado" },
] as const;

export const DIAGNOSTICO_ESTADO_LABELS = Object.fromEntries(DIAGNOSTICO_ESTADOS.map((e) => [e.value, e.label])) as Record<string, string>;

// The prioritization quadrants, in the order to tackle them.
export const CUADRANTES = [
  { value: "quick_win", label: "Quick win", detalle: "Factible y se paga rápido: por aquí se empieza." },
  { value: "estrategico", label: "Estratégico", detalle: "Se paga rápido, pero hay que ordenar el proceso antes de automatizarlo." },
  { value: "mejora_menor", label: "Mejora menor", detalle: "Fácil de automatizar, con un retorno más lento." },
  { value: "postergar", label: "Postergar", detalle: "Hoy no compensa: poco ahorro o difícil de automatizar." },
] as const;

export const CUADRANTE_LABELS = Object.fromEntries(CUADRANTES.map((c) => [c.value, c.label])) as Record<string, string>;

// The five feasibility criteria, scored 1 (no) to 5 (fully).
export const CRITERIOS = [
  { key: "reglasClaras", label: "Reglas claras", ayuda: "Las decisiones siguen reglas, no el criterio de cada persona." },
  { key: "datosDigitales", label: "Datos digitales", ayuda: "La información llega en archivos o sistemas, no en papel." },
  { key: "sistemasEstables", label: "Sistemas estables", ayuda: "Las pantallas y los sistemas que se usan no cambian seguido." },
  { key: "procesoEstandar", label: "Proceso estándar", ayuda: "Todos lo hacen de la misma forma." },
  { key: "pocasExcepciones", label: "Pocas excepciones", ayuda: "Casi todos los casos siguen el camino normal." },
] as const;

export type CriterioKey = (typeof CRITERIOS)[number]["key"];

export type ProcesoInput = {
  nombre: string;
  area: string | null;
  descripcion: string | null;
  servicio: string;
  ejecucionesMes: number;
  minutosPorEjecucion: number;
  personas: number;
  tasaError: number;
  costoHora: number | null;
  reglasClaras: number;
  datosDigitales: number;
  sistemasEstables: number;
  procesoEstandar: number;
  pocasExcepciones: number;
  porcentajeAutomatizable: number;
  costoImplementacion: number;
  costoMensual: number;
};

export type Calculo = {
  horasMes: number;
  horasLiberadasMes: number;
  fte: number;
  ahorroMensual: number;
  ahorroAnual: number;
  costoPrimerAnio: number;
  roi12Meses: number | null;
  paybackMeses: number | null;
  factibilidad: number;
  cuadrante: string;
};

export type Proceso = ProcesoInput & { id: number; orden: number; calculo: Calculo };

export type Totales = {
  procesos: number;
  quickWins: number;
  horasLiberadasMes: number;
  fte: number;
  ahorroAnual: number;
  inversion: number;
  costoMensual: number;
  costoPrimerAnio: number;
  roi12Meses: number | null;
  paybackMeses: number | null;
};

export type DiagnosticoItem = {
  id: number;
  titulo: string;
  empresaId: number;
  empresaNombre: string;
  oportunidadId: number | null;
  oportunidadTitulo: string | null;
  estado: string;
  responsableNombre: string | null;
  totales: Totales;
  updatedAtUtc: string;
};

export type Diagnostico = Omit<DiagnosticoItem, "totales"> & {
  oportunidadEtapa: string | null;
  costoHora: number;
  resumen: string | null;
  responsableId: number | null;
  entregadoAtUtc: string | null;
  createdAtUtc: string;
  procesos: Proceso[];
  totales: Totales;
};

// --- Formatting (by hand, so server and browser agree) -----------------------

export function formatNumero(value: number, decimales = 0) {
  const [entero, fraccion] = Math.abs(value).toFixed(decimales).split(".");
  const agrupado = entero!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < 0 ? "-" : ""}${agrupado}${fraccion ? `.${fraccion}` : ""}`;
}

export function formatPorcentaje(ratio: number | null) {
  return ratio === null ? "—" : `${formatNumero(ratio * 100)}%`;
}

export function formatPayback(meses: number | null) {
  if (meses === null) return "No se recupera";
  if (meses < 1) return "Menos de 1 mes";
  return `${formatNumero(meses, meses < 10 ? 1 : 0)} ${meses === 1 ? "mes" : "meses"}`;
}
