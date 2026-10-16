import { z } from "zod";
import { SERVICIOS } from "@/lib/comercial";

const servicios = SERVICIOS.map((s) => s.value) as [string, ...string[]];

// Numeric inputs are registered with valueAsNumber: an empty one is NaN,
// which z.number() rejects with the message given here.
const numero = (mensaje: string, max: number) =>
  z.number({ message: mensaje }).min(0, "No puede ser negativo.").max(max, `Máximo ${max.toLocaleString("en-US")}.`);
const puntaje = z.number().int().min(1).max(5);

export const procesoSchema = z.object({
  nombre: z.string().trim().min(3, "Ponle nombre al proceso (mínimo 3 caracteres).").max(200),
  area: z.string().trim().max(120, "Máximo 120 caracteres."),
  descripcion: z.string().trim().max(2000, "Máximo 2000 caracteres."),
  servicio: z.enum(servicios),
  ejecucionesMes: numero("¿Cuántas veces al mes se hace?", 1_000_000).int("Usa un número entero."),
  minutosPorEjecucion: numero("¿Cuántos minutos toma cada vez?", 100_000),
  personas: numero("¿Cuántas personas lo hacen?", 100_000).int("Usa un número entero."),
  tasaError: numero("Ingresa el % de error (0 si no hay).", 100),
  // Empty means "use the diagnosis's hourly cost".
  costoHora: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 10_000), "Monto no válido."),
  reglasClaras: puntaje,
  datosDigitales: puntaje,
  sistemasEstables: puntaje,
  procesoEstandar: puntaje,
  pocasExcepciones: puntaje,
  porcentajeAutomatizable: numero("¿Qué parte del trabajo haría el bot?", 100),
  costoImplementacion: numero("Ingresa el costo de implementación (0 si aún no se estima).", 1_000_000_000),
  costoMensual: numero("Ingresa el costo mensual (0 si no hay).", 100_000_000),
});

export type ProcesoValues = z.infer<typeof procesoSchema>;

export const AREAS_SUGERIDAS = [
  "Finanzas",
  "Contabilidad",
  "Recursos Humanos",
  "Logística",
  "Comercial",
  "Atención al cliente",
  "Tributario",
  "Operaciones",
  "Compras",
  "TI",
];
