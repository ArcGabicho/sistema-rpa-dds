import { z } from "zod";
import { SERVICIOS } from "@/lib/comercial";

const servicios = SERVICIOS.map((s) => s.value) as [string, ...string[]];

// Numeric inputs are registered with valueAsNumber: an empty one is NaN,
// which z.number() rejects with the message given here.
const numero = (mensaje: string, max: number) =>
  z.number({ message: mensaje }).min(0, "No puede ser negativo.").max(max, `Máximo ${max.toLocaleString("en-US")}.`);
const entero = (mensaje: string) => numero(mensaje, 100_000_000).int("Usa un número entero.");

export const botSchema = z
  .object({
    nombre: z.string().trim().min(3, "Nombra el bot (mínimo 3 caracteres).").max(200),
    descripcion: z.string().trim().max(2000, "Máximo 2000 caracteres."),
    servicio: z.enum(servicios),
    estado: z.enum(["activo", "en_pausa", "retirado"]),
    plataforma: z.string().trim().max(100, "Máximo 100 caracteres."),
    horario: z.string().trim().max(200, "Máximo 200 caracteres."),
    enProduccionDesde: z.string().min(1, "¿Desde cuándo está en producción?"),
    retiradoEl: z.string(),
    responsableId: z.string(),
    horasMesEstimadas: numero("¿Cuántas horas al mes libera, según el diagnóstico?", 100_000),
    costoHora: numero("¿Cuánto cuesta una hora del personal del cliente?", 10_000),
    minutosPorCaso: numero("¿Cuántos minutos tomaba cada caso a mano?", 10_000),
  })
  .refine((v) => !v.retiradoEl || v.retiradoEl >= v.enProduccionDesde, {
    path: ["retiradoEl"],
    message: "No puede retirarse antes de entrar en producción.",
  });

export type BotValues = z.infer<typeof botSchema>;

export const medicionSchema = z
  .object({
    mes: z.string().regex(/^\d{4}-\d{2}$/, "Elige el mes."),
    ejecuciones: entero("¿Cuántas veces corrió?"),
    ejecucionesFallidas: entero("¿Cuántas ejecuciones fallaron? (0 si ninguna)"),
    casosProcesados: entero("¿Cuántos casos resolvió solo?"),
    casosDerivados: entero("¿Cuántos casos pasó a una persona? (0 si ninguno)"),
    notas: z.string().trim().max(500, "Máximo 500 caracteres."),
  })
  .refine((v) => !(v.ejecucionesFallidas > v.ejecuciones), {
    path: ["ejecucionesFallidas"],
    message: "No pueden ser más que las ejecuciones.",
  });

export type MedicionValues = z.infer<typeof medicionSchema>;

export const incidenciaSchema = z.object({
  destino: z.string().regex(/^(bot|empresa):\d+$/, "Elige el bot o la empresa."),
  titulo: z.string().trim().min(5, "Resume la incidencia (mínimo 5 caracteres).").max(200),
  descripcion: z.string().trim().max(4000, "Máximo 4000 caracteres."),
  severidad: z.enum(["critica", "alta", "media", "baja"]),
  canal: z.enum(["monitoreo", "correo", "whatsapp", "llamada", "interno"]),
  reportadoPor: z.string().trim().max(200, "Máximo 200 caracteres."),
  responsableId: z.string(),
});

export type IncidenciaValues = z.infer<typeof incidenciaSchema>;
