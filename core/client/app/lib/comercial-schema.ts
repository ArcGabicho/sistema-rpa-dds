import { z } from "zod";
import { EMPRESA_ESTADOS, ETAPAS, SERVICIOS } from "@/lib/comercial";

// SUNAT's RUC check digit (modulo 11), the same check as Services/Ruc.cs.
export function isValidRuc(ruc: string) {
  if (!/^\d{11}$/.test(ruc)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, i) => total + weight * Number(ruc[i]), 0);
  const digit = 11 - (sum % 11);
  return (digit === 10 ? 0 : digit === 11 ? 1 : digit) === Number(ruc[10]);
}

const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);
const values = <T extends readonly { value: string }[]>(options: T) =>
  options.map((option) => option.value) as [T[number]["value"], ...T[number]["value"][]];

export const empresaSchema = z.object({
  nombreComercial: z.string().trim().min(2, "Ingresa el nombre de la empresa.").max(300),
  razonSocial: optionalText(300),
  ruc: z
    .string()
    .trim()
    .refine((ruc) => ruc === "" || /^\d{11}$/.test(ruc), "El RUC tiene 11 dígitos.")
    .refine((ruc) => ruc === "" || isValidRuc(ruc), "RUC no válido: revisa el dígito verificador."),
  rubro: optionalText(200),
  sitioWeb: optionalText(500),
  direccion: optionalText(500),
  distrito: optionalText(120),
  provincia: optionalText(120),
  estado: z.enum(values(EMPRESA_ESTADOS)),
  origen: optionalText(120),
  responsableId: z.string(),
});

export type EmpresaValues = z.infer<typeof empresaSchema>;

export const contactoSchema = z.object({
  nombres: z.string().trim().min(2, "Ingresa el nombre.").max(150),
  apellidos: optionalText(150),
  cargo: optionalText(150),
  email: z.union([z.literal(""), z.email("Correo no válido.").max(256)]),
  telefono: optionalText(30),
});

export type ContactoValues = z.infer<typeof contactoSchema>;

// Amounts and dates stay strings in the form (that's what inputs hold) and
// are converted when the request is built.
export const oportunidadSchema = z
  .object({
    empresaId: z.number({ message: "Elige una empresa." }).int().positive("Elige una empresa."),
    contactoId: z.string(),
    titulo: z.string().trim().min(3, "Describe la oportunidad (mínimo 3 caracteres).").max(200),
    servicio: z.enum(values(SERVICIOS)),
    etapa: z.enum(values(ETAPAS)),
    valorEstimado: z
      .string()
      .trim()
      .refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 999_999_999_999), "Monto no válido."),
    fechaCierreEstimada: z.string(),
    responsableId: z.string(),
    proximaAccion: optionalText(300),
    proximaAccionFecha: z.string(),
    motivoPerdida: optionalText(500),
  })
  .refine((v) => v.proximaAccion === "" || v.proximaAccionFecha !== "", {
    path: ["proximaAccionFecha"],
    message: "Ponle fecha a la próxima acción.",
  })
  .refine((v) => v.etapa !== "perdida" || v.motivoPerdida !== "", {
    path: ["motivoPerdida"],
    message: "Anota por qué se perdió.",
  });

export type OportunidadValues = z.infer<typeof oportunidadSchema>;

// Form strings -> API values: "" means "not set".
export const orNull = (value: string) => (value.trim() === "" ? null : value.trim());
export const idOrNull = (value: string) => (value === "" ? null : Number(value));
