import { z } from "zod";

const monto = (mensaje: string) => z.number({ message: mensaje }).min(0, "No puede ser negativo.").max(1_000_000_000);

export const propuestaSchema = z.object({
  titulo: z.string().trim().min(3, "Ponle un título (mínimo 3 caracteres).").max(200),
  moneda: z.enum(["PEN", "USD"]),
  descuentoPorcentaje: z.number({ message: "Ingresa el descuento (0 si no hay)." }).min(0, "Mínimo 0 %.").max(100, "Máximo 100 %."),
  // Empty: no expected saving shown.
  ahorroAnualEstimado: z.string().trim().refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 1_000_000_000), "Monto no válido."),
  validaHasta: z.string(),
  responsableId: z.string(),
  introduccion: z.string().trim().max(4000, "Máximo 4000 caracteres."),
  supuestos: z.string().trim().max(4000, "Máximo 4000 caracteres."),
  exclusiones: z.string().trim().max(4000, "Máximo 4000 caracteres."),
  condicionesPago: z.string().trim().max(1000, "Máximo 1000 caracteres."),
  items: z
    .array(
      z.object({
        tipo: z.enum(["implementacion", "mensual"]),
        descripcion: z.string().trim().min(2, "Describe el ítem.").max(300),
        detalle: z.string().trim().max(2000),
        cantidad: z.number({ message: "Cantidad." }).gt(0, "Mayor que 0.").max(100_000),
        precioUnitario: monto("Precio."),
        procesoOrigenId: z.number().nullable(),
      }),
    )
    .max(100, "Máximo 100 ítems."),
  fases: z
    .array(
      z.object({
        nombre: z.string().trim().min(2, "Nombra la fase.").max(200),
        descripcion: z.string().trim().max(1000),
        semanas: z.number({ message: "Semanas." }).int("Semanas enteras.").min(1, "Mínimo 1.").max(104, "Máximo 104."),
      }),
    )
    .max(30, "Máximo 30 fases."),
});

export type PropuestaValues = z.infer<typeof propuestaSchema>;
