// Shared vocabulary of the vault (Bóveda), mirroring core/server/Models/Secreto.cs.

export const SECRETO_TIPOS = [
  { value: "credencial", label: "Usuario y contraseña" },
  { value: "api_key", label: "API key" },
  { value: "token", label: "Token de acceso" },
  { value: "conexion", label: "Cadena de conexión" },
  { value: "certificado", label: "Certificado o llave privada" },
  { value: "nota", label: "Nota segura" },
] as const;

export type SecretoTipo = (typeof SECRETO_TIPOS)[number]["value"];

export const SECRETO_TIPO_LABELS = Object.fromEntries(SECRETO_TIPOS.map((t) => [t.value, t.label])) as Record<string, string>;

// Values that run over several lines get a textarea instead of an input.
export const TIPOS_MULTILINEA: string[] = ["certificado", "nota", "conexion"];

// Names of the actions, for the audit log's filter.
export const ACCION_LABELS: Record<string, string> = {
  creado: "Creadas",
  revelado: "Reveladas",
  copiado: "Copiadas",
  editado: "Editadas",
  rotado: "Rotadas",
  eliminado: "Eliminadas",
};

export const ACCIONES = Object.keys(ACCION_LABELS);

// Same window as the API's DiasAviso.
export const DIAS_AVISO = 30;

export type Vencimiento = "sin_vencimiento" | "vigente" | "por_vencer" | "vencido";

// Days between two "YYYY-MM-DD" dates, without time zones getting in.
function dias(desde: string, hasta: string) {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}

export function vencimiento(venceEl: string | null, today: string): { estado: Vencimiento; dias: number | null } {
  if (!venceEl) return { estado: "sin_vencimiento", dias: null };
  const restantes = dias(today, venceEl.slice(0, 10));
  if (restantes < 0) return { estado: "vencido", dias: restantes };
  if (restantes <= DIAS_AVISO) return { estado: "por_vencer", dias: restantes };
  return { estado: "vigente", dias: restantes };
}

export type SecretoItem = {
  id: number;
  nombre: string;
  tipo: string;
  empresaId: number | null;
  empresaNombre: string | null;
  usuario: string | null;
  url: string | null;
  venceEl: string | null;
  rotadoAtUtc: string;
  restringido: boolean;
};

export type AccesoSecreto = {
  id: number;
  secretoId: number | null;
  secretoNombre: string;
  usuarioNombre: string;
  accion: string;
  ip: string | null;
  createdAtUtc: string;
};

export type Secreto = SecretoItem & {
  notas: string | null;
  createdAtUtc: string;
  accesos: AccesoSecreto[];
};

export type BovedaResumen = { configurada: boolean; total: number; porVencer: number; vencidos: number };

// Strong random value for a new password or key: no look-alike characters
// (0/O, 1/l/I), drawn with the browser's CSPRNG.
export function generarClave(length = 24) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#$%&*+-?@";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => chars[n % chars.length]).join("");
}
