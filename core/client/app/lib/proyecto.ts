// Shared vocabulary of projects, mirroring core/server/Models/Proyecto.cs.

export const PROYECTO_ESTADOS = [
  { value: "planificado", label: "Planificado" },
  { value: "en_curso", label: "En curso" },
  { value: "en_pausa", label: "En pausa" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export const HITO_ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_curso", label: "En curso" },
  { value: "completado", label: "Completado" },
] as const;

export const TAREA_ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_progreso", label: "En progreso" },
  { value: "bloqueada", label: "Bloqueada" },
  { value: "hecha", label: "Hecha" },
] as const;

export const ETAPAS_DESARROLLO = [
  { value: "levantamiento", label: "Levantamiento" },
  { value: "desarrollo", label: "Desarrollo" },
  { value: "pruebas", label: "Pruebas" },
  { value: "produccion", label: "En producción" },
] as const;

export const PDD_ESTADOS = [
  { value: "borrador", label: "Borrador" },
  { value: "en_revision", label: "En revisión del cliente" },
  { value: "aprobado", label: "Aprobado" },
] as const;

const labels = (options: readonly { value: string; label: string }[]) =>
  Object.fromEntries(options.map((o) => [o.value, o.label])) as Record<string, string>;

export const PROYECTO_ESTADO_LABELS = labels(PROYECTO_ESTADOS);
export const HITO_ESTADO_LABELS = labels(HITO_ESTADOS);
export const TAREA_ESTADO_LABELS = labels(TAREA_ESTADOS);
export const ETAPA_DESARROLLO_LABELS = labels(ETAPAS_DESARROLLO);
export const PDD_ESTADO_LABELS = labels(PDD_ESTADOS);

// The PDD's sections, in document order. `lista`: one item per line (shown
// as a list; numbered when `numerada`).
export const PDD_SECCIONES = [
  { key: "pddObjetivo", label: "Objetivo", ayuda: "Qué busca la automatización y para quién.", lista: false },
  { key: "pddAlcance", label: "Alcance", ayuda: "Qué cubre y qué no.", lista: false },
  { key: "pddSistemas", label: "Sistemas", ayuda: "Uno por línea.", lista: true },
  { key: "pddEntradas", label: "Entradas", ayuda: "Lo que inicia o alimenta el proceso. Una por línea.", lista: true },
  { key: "pddSalidas", label: "Salidas", ayuda: "Lo que produce. Una por línea.", lista: true },
  { key: "pddPasosActuales", label: "Proceso actual (AS-IS)", ayuda: "Un paso por línea, en orden.", lista: true, numerada: true },
  { key: "pddReglas", label: "Reglas de negocio", ayuda: "Una por línea.", lista: true },
  { key: "pddExcepciones", label: "Excepciones", ayuda: "Una por línea: el caso → qué se hace.", lista: true },
  { key: "pddPasosPropuestos", label: "Proceso automatizado (TO-BE)", ayuda: "Un paso por línea, en orden.", lista: true, numerada: true },
  { key: "pddPreguntas", label: "Preguntas abiertas", ayuda: "Lo que falta confirmar con el cliente. Una por línea.", lista: true },
] as const;

export type PddKey = (typeof PDD_SECCIONES)[number]["key"];

export type Hito = {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  completadoAtUtc: string | null;
  atrasado: boolean;
};

export type Tarea = {
  id: number;
  titulo: string;
  hitoId: number | null;
  estado: string;
  responsableId: number | null;
  responsableNombre: string | null;
  fechaLimite: string | null;
  bloqueo: string | null;
  completadaAtUtc: string | null;
  vencida: boolean;
};

export type ProcesoProyectoItem = {
  id: number;
  nombre: string;
  area: string | null;
  servicio: string;
  etapa: string;
  pddEstado: string;
  pddVersion: number;
  tienePdd: boolean;
  botId: number | null;
};

export type ProyectoItem = {
  id: number;
  nombre: string;
  empresaId: number;
  empresaNombre: string;
  estado: string;
  responsableNombre: string | null;
  fechaInicio: string;
  fechaFinPlan: string;
  fechaFinReal: string | null;
  tareasTotal: number;
  tareasHechas: number;
  tareasBloqueadas: number;
  procesos: number;
  atrasado: boolean;
  hitoActual: string | null;
};

export type Proyecto = ProyectoItem & {
  descripcion: string | null;
  oportunidadId: number | null;
  oportunidadTitulo: string | null;
  propuestaId: number | null;
  propuestaNombre: string | null;
  responsableId: number | null;
  hitos: Hito[];
  tareas: Tarea[];
  procesosLista: ProcesoProyectoItem[];
};

export type ProcesoProyecto = {
  id: number;
  proyectoId: number;
  proyectoNombre: string;
  empresaId: number;
  empresaNombre: string;
  contactoNombre: string | null;
  nombre: string;
  area: string | null;
  servicio: string;
  etapa: string;
  notasLevantamiento: string | null;
  pddEstado: string;
  pddConIa: boolean;
  pddAprobadoPor: string | null;
  pddAprobadoAtUtc: string | null;
  pddVersion: number;
  updatedAtUtc: string;
  ejecucionesMes: number | null;
  minutosPorEjecucion: number | null;
  personas: number | null;
  horasLiberadasMes: number | null;
  comoSeHaceHoy: string | null;
} & Record<PddKey, string | null>;

export function progreso(p: { tareasTotal: number; tareasHechas: number }) {
  return p.tareasTotal === 0 ? 0 : Math.round((p.tareasHechas / p.tareasTotal) * 100);
}

export function lineas(texto: string | null | undefined) {
  return (texto ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
}

// The Monday after a "YYYY-MM-DD" date (the default project start).
export function proximoLunes(today: string) {
  const d = new Date(`${today}T00:00:00Z`);
  const dias = ((8 - d.getUTCDay()) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
