import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Ingresa tu correo.").max(256, "Correo demasiado largo.").email("Correo no válido."),
  password: z.string().min(1, "Ingresa tu contraseña.").max(128, "Máximo 128 caracteres."),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
