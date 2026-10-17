// Roles, modules and access levels, mirroring core/server/Models/Permisos.cs
// and AdminRole.cs. The API enforces them; the panel only uses them to show
// what each user can reach and change.

export type Nivel = "ninguno" | "ver" | "editar";

export const MODULOS = [
  { value: "comercial", label: "Comercial", ayuda: "Empresas, contactos, oportunidades y solicitudes web." },
  { value: "diagnosticos", label: "Diagnósticos", ayuda: "Levantamiento de procesos y cálculo de ROI." },
  { value: "propuestas", label: "Propuestas", ayuda: "Propuestas técnicas y económicas." },
  { value: "proyectos", label: "Proyectos", ayuda: "Hitos, tareas y PDD de cada proceso." },
  { value: "boveda", label: "Bóveda", ayuda: "Credenciales de los clientes y de DDS." },
  { value: "operacion", label: "Operación", ayuda: "Bots en producción, incidencias y vencimientos." },
] as const;

export type Modulo = (typeof MODULOS)[number]["value"];

export const NIVELES: { value: Nivel; label: string }[] = [
  { value: "ninguno", label: "Sin acceso" },
  { value: "ver", label: "Ver" },
  { value: "editar", label: "Editar" },
];

export const NIVEL_LABELS: Record<string, string> = Object.fromEntries(NIVELES.map((n) => [n.value, n.label]));

export const ROLES = [
  { value: "Admin", label: "Administrador", ayuda: "Todo, más usuarios, eliminaciones, credenciales restringidas y el registro de la Bóveda." },
  { value: "Comercial", label: "Comercial", ayuda: "Vende: embudo, diagnósticos y propuestas. Ve proyectos y operación; no entra a la Bóveda." },
  { value: "Consultor", label: "Consultor", ayuda: "Entrega: diagnósticos, proyectos y PDD, y la Bóveda. Ve el embudo, las propuestas y la operación." },
  { value: "Soporte", label: "Soporte", ayuda: "Opera: bots, incidencias, vencimientos y la Bóveda. Ve clientes y proyectos." },
] as const;

export const ROL_LABELS: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

// The signed-in user, from GET api/auth/me.
export type Me = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  roleLabel: string;
  esAdmin: boolean;
  permisos: Record<Modulo, Nivel>;
};

const RANGO: Record<Nivel, number> = { ninguno: 0, ver: 1, editar: 2 };

export function puede(me: Me | null, modulo: Modulo, nivel: Nivel = "ver") {
  if (!me) return false;
  if (me.esAdmin) return true;
  return RANGO[me.permisos[modulo] ?? "ninguno"] >= RANGO[nivel];
}
