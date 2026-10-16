import { z } from "zod";
import { SECRETO_TIPOS } from "@/lib/boveda";

const tipos = SECRETO_TIPOS.map((t) => t.value) as [string, ...string[]];

export const secretoMetadataSchema = z.object({
  nombre: z.string().trim().min(2, "Ponle un nombre que diga qué es y dónde se usa.").max(200),
  tipo: z.enum(tipos),
  usuario: z.string().trim().max(256, "Máximo 256 caracteres."),
  url: z.string().trim().max(500, "Máximo 500 caracteres."),
  notas: z.string().trim().max(1000, "Máximo 1000 caracteres."),
  venceEl: z.string(),
  restringido: z.boolean(),
});

// On create, the value too. It isn't trimmed: spaces may be part of it.
export const secretoCreateSchema = secretoMetadataSchema.extend({
  valor: z.string().min(1, "Ingresa el valor que se guardará cifrado.").max(10_000, "Máximo 10 000 caracteres."),
});

// On edit the value isn't part of the form (it's rotated on its own); the
// field stays so both forms share one shape.
export const secretoEditSchema = secretoMetadataSchema.extend({ valor: z.string() });

export type SecretoMetadataValues = z.infer<typeof secretoMetadataSchema>;
export type SecretoCreateValues = z.infer<typeof secretoCreateSchema>;
