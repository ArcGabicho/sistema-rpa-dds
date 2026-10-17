// Shared vocabulary of operation and support, mirroring
// core/server/Models/Operacion.cs.

export const BOT_ESTADOS = [
  { value: "activo", label: "Activo" },
  { value: "en_pausa", label: "En pausa" },
  { value: "retirado", label: "Retirado" },
] as const;

export const SEVERIDADES = [
  { value: "critica", label: "Crítica", ayuda: "El bot está detenido y frena la operación del cliente." },
  { value: "alta", label: "Alta", ayuda: "Falla parte del proceso o hay casos atascados." },
  { value: "media", label: "Media", ayuda: "Funciona con errores o demoras." },
  { value: "baja", label: "Baja", ayuda: "Consulta o cambio menor." },
] as const;

export const INCIDENCIA_ESTADOS = [
  { value: "abierta", label: "Abierta" },
  { value: "en_atencion", label: "En atención" },
  { value: "esperando_cliente", label: "Esperando al cliente" },
  { value: "resuelta", label: "Resuelta" },
] as const;

export const CAUSAS = [
  { value: "cambio_sistema", label: "Cambio en un sistema del cliente" },
  { value: "credenciales", label: "Credenciales vencidas o bloqueadas" },
  { value: "datos", label: "Datos de entrada" },
  { value: "infraestructura", label: "Infraestructura" },
  { value: "error_bot", label: "Error del bot" },
  { value: "solicitud", label: "Solicitud del cliente" },
  { value: "otro", label: "Otra" },
] as const;

export const CANALES = [
  { value: "monitoreo", label: "Alerta del monitoreo" },
  { value: "correo", label: "Correo" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "llamada", label: "Llamada" },
  { value: "interno", label: "Detectada por DDS" },
] as const;

export const PLATAFORMAS_SUGERIDAS = ["UiPath", "Power Automate", "Python", "n8n", "n8n + Claude", "Python + Azure OpenAI", "Power BI", "Automation Anywhere"];

const labels = (options: readonly { value: string; label: string }[]) =>
  Object.fromEntries(options.map((o) => [o.value, o.label])) as Record<string, string>;

export const BOT_ESTADO_LABELS = labels(BOT_ESTADOS);
export const SEVERIDAD_LABELS = labels(SEVERIDADES);
export const INCIDENCIA_ESTADO_LABELS = labels(INCIDENCIA_ESTADOS);
export const CAUSA_LABELS = labels(CAUSAS);
export const CANAL_LABELS = labels(CANALES);
export const INCIDENCIA_ABIERTAS = ["abierta", "en_atencion", "esperando_cliente"];

// Same targets as the API's Services/Sla.cs (calendar hours).
export const SLA_OBJETIVOS: Record<string, { respuesta: number; resolucion: number }> = {
  critica: { respuesta: 1, resolucion: 8 },
  alta: { respuesta: 4, resolucion: 24 },
  media: { respuesta: 8, resolucion: 72 },
  baja: { respuesta: 24, resolucion: 120 },
};

// A month's real saving, mirroring the API's Ahorro.Calcular, for the
// record form's preview: each case handled on its own saves the manual
// minutes it took, at the client's cost per hour.
export function ahorroDelMes(casosProcesados: number, minutosPorCaso: number, costoHora: number) {
  const horas = (casosProcesados * minutosPorCaso) / 60;
  return { horas: Math.round(horas * 10) / 10, ahorro: Math.round(horas * costoHora * 100) / 100 };
}

// The estimate for a month, prorated by the days in production, mirroring
// the API's Ahorro.EstimadoDelMes. Dates are "YYYY-MM-DD…".
export function estimadoDelMes(
  bot: { horasMesEstimadas: number; costoHora: number; enProduccionDesde: string; retiradoEl: string | null },
  mes: string,
) {
  const dia = (fecha: string) => Date.parse(`${fecha.slice(0, 10)}T00:00:00Z`);
  const [anio, numero] = mes.slice(0, 7).split("-").map(Number);
  const inicio = Date.UTC(anio!, numero! - 1, 1);
  const fin = Date.UTC(anio!, numero!, 1);
  const desde = Math.max(inicio, dia(bot.enProduccionDesde));
  const hasta = bot.retiradoEl ? Math.min(fin, dia(bot.retiradoEl)) : fin;
  if (hasta <= desde) return 0;
  const mensual = Math.round(bot.horasMesEstimadas * bot.costoHora * 100) / 100;
  return Math.round(((mensual * (hasta - desde)) / (fin - inicio)) * 100) / 100;
}

// The server's clock at render time, for SLA countdowns: pages pass it down
// so the server and the browser show the same time left.
export function relojServidor() {
  return Date.now();
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// "2026-09-01T00:00:00" -> "septiembre 2026".
export function nombreMes(mes: string, conAnio = true) {
  const [anio, numero] = mes.slice(0, 7).split("-");
  const nombre = MESES[Number(numero) - 1] ?? mes;
  return conAnio ? `${nombre} ${anio}` : nombre;
}

// Hours as "45 min", "3 h", "2 d 4 h": SLA windows and resolution times.
export function duracion(horas: number) {
  const h = Math.abs(horas);
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${Math.round(h)} h`;
  const dias = Math.floor(h / 24);
  const resto = Math.round(h - dias * 24);
  return resto > 0 ? `${dias} d ${resto} h` : `${dias} d`;
}

export type Medicion = {
  mes: string;
  ejecuciones: number;
  ejecucionesFallidas: number;
  casosProcesados: number;
  casosDerivados: number;
  notas: string | null;
  horasAhorradas: number;
  ahorroReal: number;
  ahorroEstimado: number;
  cumplimiento: number | null;
  tasaExito: number | null;
};

export type BotItem = {
  id: number;
  nombre: string;
  empresaId: number;
  empresaNombre: string;
  servicio: string;
  plataforma: string | null;
  estado: string;
  responsableNombre: string | null;
  enProduccionDesde: string;
  ahorroMensualEstimado: number;
  incidenciasAbiertas: number;
  conFalla: boolean;
  ultimoMes: string;
  ultimo: Medicion | null;
  sinRegistro: boolean;
};

export type Sla = {
  objetivoRespuestaHoras: number;
  objetivoResolucionHoras: number;
  venceRespuestaUtc: string;
  venceResolucionUtc: string;
  respuestaCumplida: boolean | null;
  resolucionCumplida: boolean | null;
  semaforo: "a_tiempo" | "en_riesgo" | "vencido" | "pausado" | "cumplido" | "incumplido";
};

export type IncidenciaItem = {
  id: number;
  codigo: string;
  titulo: string;
  empresaId: number;
  empresaNombre: string;
  botId: number | null;
  botNombre: string | null;
  severidad: string;
  estado: string;
  causa: string | null;
  responsableNombre: string | null;
  createdAtUtc: string;
  resueltaAtUtc: string | null;
  sla: Sla;
};

export type Seguimiento = {
  id: number;
  tipo: "nota" | "cambio";
  texto: string;
  autorNombre: string | null;
  createdAtUtc: string;
};

export type Incidencia = IncidenciaItem & {
  descripcion: string | null;
  canal: string;
  reportadoPor: string | null;
  responsableId: number | null;
  primeraRespuestaAtUtc: string | null;
  minutosEnPausa: number;
  pausadaDesdeUtc: string | null;
  solucion: string | null;
  seguimiento: Seguimiento[];
};

export type Licencia = {
  id: number;
  empresaId: number | null;
  empresaNombre: string | null;
  botId: number | null;
  botNombre: string | null;
  nombre: string;
  proveedor: string | null;
  cantidad: number;
  costoAnual: number | null;
  moneda: string;
  pagaCliente: boolean;
  venceEl: string;
  notas: string | null;
  vencimiento: string;
  dias: number;
};

export type Bot = BotItem & {
  descripcion: string | null;
  proyectoId: number | null;
  proyectoNombre: string | null;
  procesoProyectoId: number | null;
  procesoNombre: string | null;
  horario: string | null;
  retiradoEl: string | null;
  responsableId: number | null;
  horasMesEstimadas: number;
  costoHora: number;
  minutosPorCaso: number;
  mediciones: Medicion[];
  acumulado: { meses: number; horasAhorradas: number; ahorroReal: number; ahorroEstimado: number; cumplimiento: number | null };
  mesesSinRegistro: string[];
  incidencias: IncidenciaItem[];
  licencias: Licencia[];
};

export type BotsResumen = {
  activos: number;
  enPausa: number;
  mes: string;
  ahorroRealMes: number;
  ahorroEstimadoMes: number;
  cumplimientoMes: number | null;
  sinRegistro: number;
  ahorroRealAcumulado: number;
  horasAcumuladas: number;
  serie: { mes: string; real: number; estimado: number }[];
};

export type BorradorBot = {
  nombre: string;
  empresaId: number;
  empresaNombre: string;
  proyectoId: number | null;
  proyectoNombre: string | null;
  procesoProyectoId: number | null;
  servicio: string;
  horasMesEstimadas: number;
  costoHora: number;
  minutosPorCaso: number;
  desdeDiagnostico: boolean;
  botExistenteId: number | null;
};

export type IncidenciasResumen = {
  abiertas: number;
  graves: number;
  fueraDeSla: number;
  resueltas90: number;
  cumplimientoSla90: number | null;
  horasMedianaResolucion90: number | null;
  porCausa90: { causa: string; cantidad: number }[];
};

export type Contrato = {
  id: number;
  empresaId: number;
  empresaNombre: string;
  propuestaId: number | null;
  propuestaNombre: string | null;
  nombre: string;
  estado: string;
  montoMensual: number;
  moneda: string;
  fechaInicio: string;
  fechaFin: string;
  notas: string | null;
  oportunidadRenovacionId: number | null;
  oportunidadRenovacionTitulo: string | null;
  oportunidadRenovacionEtapa: string | null;
  vencimiento: string;
  dias: number;
};

export type VencimientoItem = {
  tipo: "contrato" | "licencia" | "credencial";
  id: number;
  nombre: string;
  empresaId: number | null;
  empresaNombre: string | null;
  venceEl: string;
  dias: number;
  estado: "vencido" | "por_vencer" | "vigente";
  detalle: string | null;
  oportunidadRenovacionId: number | null;
};
