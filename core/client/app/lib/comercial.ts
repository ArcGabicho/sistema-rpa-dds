// Shared vocabulary of the Comercial module (companies, contacts,
// opportunities and their activity), mirroring core/server/Models.

export const ETAPAS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "propuesta", label: "Propuesta" },
  { value: "negociacion", label: "Negociación" },
  { value: "ganada", label: "Ganada" },
  { value: "perdida", label: "Perdida" },
] as const;

export type Etapa = (typeof ETAPAS)[number]["value"];

// Stages still in play, in pipeline order: the board's columns.
export const ETAPAS_ABIERTAS: Etapa[] = ["nuevo", "contactado", "diagnostico", "propuesta", "negociacion"];

export const SERVICIOS = [
  { value: "rpa", label: "Automatización RPA" },
  { value: "ia", label: "Inteligencia Artificial" },
  { value: "analitica", label: "Analítica de Datos" },
] as const;

export const EMPRESA_ESTADOS = [
  { value: "prospecto", label: "Prospecto" },
  { value: "cliente", label: "Cliente" },
  { value: "inactiva", label: "Inactiva" },
] as const;

// Activity types a person can log; "cambio_etapa" is written by the API.
export const ACTIVIDAD_TIPOS = [
  { value: "nota", label: "Nota" },
  { value: "llamada", label: "Llamada" },
  { value: "reunion", label: "Reunión" },
  { value: "correo", label: "Correo" },
] as const;

const labels = (options: readonly { value: string; label: string }[]) =>
  Object.fromEntries(options.map((option) => [option.value, option.label])) as Record<string, string>;

export const ETAPA_LABELS = labels(ETAPAS);
export const SERVICIO_LABELS = labels(SERVICIOS);
// For tight spots like the board's cards.
export const SERVICIO_CORTO: Record<string, string> = { rpa: "RPA", ia: "IA", analitica: "Analítica" };
export const EMPRESA_ESTADO_LABELS = labels(EMPRESA_ESTADOS);
export const ACTIVIDAD_LABELS: Record<string, string> = { ...labels(ACTIVIDAD_TIPOS), cambio_etapa: "Cambio de etapa" };

// "S/ 48,500". Grouped by hand rather than with Intl's currency format, whose
// spacing differs between Node and browsers (a hydration mismatch).
export function formatSoles(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `S/ ${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function fullName(contacto: { nombres: string; apellidos: string | null }) {
  return [contacto.nombres, contacto.apellidos].filter(Boolean).join(" ");
}

// --- API shapes --------------------------------------------------------------

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type TeamUser = { id: number; fullName: string };

export type Contacto = {
  id: number;
  nombres: string;
  apellidos: string | null;
  cargo: string | null;
  email: string | null;
  telefono: string | null;
};

export type Actividad = {
  id: number;
  tipo: string;
  descripcion: string;
  autorNombre: string;
  oportunidadId: number | null;
  oportunidadTitulo: string | null;
  createdAtUtc: string;
};

export type OportunidadItem = {
  id: number;
  titulo: string;
  empresaId: number;
  empresaNombre: string;
  servicio: string;
  etapa: Etapa;
  valorEstimado: number | null;
  fechaCierreEstimada: string | null;
  responsableNombre: string | null;
  proximaAccion: string | null;
  proximaAccionFecha: string | null;
  cerradaAtUtc: string | null;
  updatedAtUtc: string;
};

export type Oportunidad = {
  id: number;
  titulo: string;
  empresaId: number;
  empresaNombre: string;
  contactoId: number | null;
  contactoNombre: string | null;
  servicio: string;
  etapa: Etapa;
  valorEstimado: number | null;
  fechaCierreEstimada: string | null;
  responsableId: number | null;
  responsableNombre: string | null;
  proximaAccion: string | null;
  proximaAccionFecha: string | null;
  motivoPerdida: string | null;
  cerradaAtUtc: string | null;
  solicitudId: number | null;
  createdAtUtc: string;
  contactosEmpresa: Contacto[];
  actividades: Actividad[];
};

export type EmpresaItem = {
  id: number;
  nombreComercial: string;
  razonSocial: string | null;
  ruc: string | null;
  rubro: string | null;
  provincia: string | null;
  estado: string;
  responsableNombre: string | null;
  contactosCount: number;
  oportunidadesAbiertas: number;
};

export type Empresa = {
  id: number;
  nombreComercial: string;
  razonSocial: string | null;
  ruc: string | null;
  rubro: string | null;
  sitioWeb: string | null;
  direccion: string | null;
  distrito: string | null;
  provincia: string | null;
  estado: string;
  origen: string | null;
  responsableId: number | null;
  responsableNombre: string | null;
  createdAtUtc: string;
  contactos: Contacto[];
  oportunidades: OportunidadItem[];
  actividades: Actividad[];
};
