import { z } from "zod";
import type { Modulo, Nivel } from "@/lib/permisos";

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa el nombre completo.").max(200),
  email: z.string().trim().min(1, "Ingresa un correo.").email("Correo no válido."),
  password: z.string().min(8, "Mínimo 8 caracteres.").max(128, "Máximo 128 caracteres."),
  role: z.enum(["Admin", "Comercial", "Consultor", "Soporte"], { message: "Elige un rol." }),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const cambiarClaveSchema = z
  .object({
    actual: z.string().min(1, "Ingresa tu contraseña actual."),
    nueva: z.string().min(8, "Mínimo 8 caracteres.").max(128, "Máximo 128 caracteres."),
    confirmar: z.string(),
  })
  .refine((v) => v.nueva === v.confirmar, { path: ["confirmar"], message: "No coincide con la nueva contraseña." })
  .refine((v) => v.nueva !== v.actual, { path: ["nueva"], message: "Debe ser distinta de la actual." });

export type CambiarClaveValues = z.infer<typeof cambiarClaveSchema>;

export type User = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  activo: boolean;
  personalizado: boolean;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
};

export type UserDetail = User & {
  permisosRol: Record<Modulo, Nivel>;
  permisosPersonalizados: Partial<Record<Modulo, Nivel>>;
  permisosEfectivos: Record<Modulo, Nivel>;
};

// GET api/users/roles: each role's preset.
export type RolPreset = { rol: string; label: string; permisos: Record<Modulo, Nivel> };
