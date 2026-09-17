import { z } from "zod";

export const ROLE_OPTIONS = [
  { value: "Admin", label: "Administrador" },
  { value: "Operador", label: "Operador" },
] as const;

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa el nombre completo."),
  email: z.string().trim().min(1, "Ingresa un correo.").email("Correo no válido."),
  password: z.string().min(8, "Mínimo 8 caracteres."),
  role: z.enum(["Admin", "Operador"], { message: "Selecciona un rol." }),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export type User = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
};
