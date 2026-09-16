import { z } from "zod";

export const SERVICE_OPTIONS = [
  { value: "analitica", label: "Servicios Analítica" },
  { value: "rpa", label: "Servicios RPA" },
  { value: "ia", label: "Servicios IA" },
] as const;

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa tu nombre completo."),
  email: z.string().trim().min(1, "Ingresa tu correo.").email("Correo no válido."),
  phone: z
    .string()
    .trim()
    .min(6, "Ingresa un teléfono válido.")
    .regex(/^[0-9+()\s-]+$/, "Usa solo números y símbolos de teléfono."),
  service: z.enum(SERVICE_OPTIONS.map((option) => option.value) as [string, ...string[]], {
    message: "Selecciona tu necesidad.",
  }),
  message: z
    .string()
    .trim()
    .min(10, "Cuéntanos un poco más (mínimo 10 caracteres).")
    .max(600, "Máximo 600 caracteres."),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
