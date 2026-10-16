// Shared vocabulary of proposals, mirroring core/server/Models/Propuesta.cs,
// and the totals math (core/server/Services/PropuestaCalculo.cs) for the
// editor's live preview.
import { retorno } from "@/lib/roi";

export const PROPUESTA_ESTADOS = [
  { value: "borrador", label: "Borrador" },
  { value: "enviada", label: "Enviada" },
  { value: "aceptada", label: "Aceptada" },
  { value: "rechazada", label: "Rechazada" },
  { value: "reemplazada", label: "Reemplazada" },
] as const;

export const PROPUESTA_ESTADO_LABELS: Record<string, string> = {
  ...Object.fromEntries(PROPUESTA_ESTADOS.map((e) => [e.value, e.label])),
  vencida: "Vencida",
};

export const MONEDAS = [
  { value: "PEN", label: "Soles (S/)", simbolo: "S/" },
  { value: "USD", label: "Dólares (US$)", simbolo: "US$" },
] as const;

export const ITEM_TIPOS = [
  { value: "implementacion", label: "Implementación (pago único)" },
  { value: "mensual", label: "Mensual" },
] as const;

export const IGV = 0.18;

export type PropuestaItem = {
  tipo: string;
  descripcion: string;
  detalle: string | null;
  cantidad: number;
  precioUnitario: number;
};

export type PropuestaFase = { nombre: string; descripcion: string | null; semanas: number };

export type TotalesPropuesta = {
  subtotalImplementacion: number;
  descuento: number;
  baseImplementacion: number;
  igvImplementacion: number;
  totalImplementacion: number;
  baseMensual: number;
  igvMensual: number;
  totalMensual: number;
  valorPrimerAnio: number;
  semanas: number;
  paybackMeses: number | null;
  roi12Meses: number | null;
};

export type PropuestaListItem = {
  id: number;
  codigo: string;
  version: number;
  titulo: string;
  empresaId: number;
  empresaNombre: string;
  oportunidadId: number | null;
  oportunidadTitulo: string | null;
  estado: string;
  moneda: string;
  totales: TotalesPropuesta;
  enviadaAtUtc: string | null;
  validaHasta: string | null;
  updatedAtUtc: string;
};

export type Propuesta = Omit<PropuestaListItem, "totales"> & {
  empresaRazonSocial: string | null;
  empresaRuc: string | null;
  oportunidadEtapa: string | null;
  contactoNombre: string | null;
  contactoCargo: string | null;
  diagnosticoId: number | null;
  diagnosticoTitulo: string | null;
  descuentoPorcentaje: number;
  ahorroAnualEstimado: number | null;
  introduccion: string | null;
  supuestos: string | null;
  exclusiones: string | null;
  condicionesPago: string | null;
  responsableId: number | null;
  responsableNombre: string | null;
  respondidaAtUtc: string | null;
  motivoRechazo: string | null;
  createdAtUtc: string;
  items: PropuestaItem[];
  fases: PropuestaFase[];
  totales: TotalesPropuesta;
  versiones: { id: number; version: number; estado: string; updatedAtUtc: string }[];
};

// "vencida" when a sent proposal is past its validity date (Lima).
export function estadoVisible(estado: string, validaHasta: string | null, today: string) {
  return estado === "enviada" && validaHasta && validaHasta.slice(0, 10) < today ? "vencida" : estado;
}

export function simbolo(moneda: string) {
  return MONEDAS.find((m) => m.value === moneda)?.simbolo ?? "S/";
}

// "S/ 48,500" or "US$ 12,000.50": grouped by hand, so server and browser agree.
export function formatMoneda(value: number, moneda: string, decimales: 0 | 2 = 0) {
  const [entero, fraccion] = Math.abs(value).toFixed(decimales).split(".");
  const agrupado = entero!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < 0 ? "-" : ""}${simbolo(moneda)} ${agrupado}${fraccion ? `.${fraccion}` : ""}`;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function calcularTotales(
  items: PropuestaItem[],
  fases: { semanas: number }[],
  descuentoPorcentaje: number,
  ahorroAnualEstimado: number | null,
): TotalesPropuesta {
  const linea = (i: PropuestaItem) => r2(i.cantidad * i.precioUnitario);
  const subtotal = r2(items.filter((i) => i.tipo === "implementacion").reduce((s, i) => s + linea(i), 0));
  const descuento = r2((subtotal * descuentoPorcentaje) / 100);
  const baseImpl = r2(subtotal - descuento);
  const igvImpl = r2(baseImpl * IGV);
  const baseMensual = r2(items.filter((i) => i.tipo === "mensual").reduce((s, i) => s + linea(i), 0));
  const igvMensual = r2(baseMensual * IGV);
  const conRetorno = ahorroAnualEstimado !== null && ahorroAnualEstimado > 0;
  const ret = conRetorno ? retorno(ahorroAnualEstimado / 12, baseImpl, baseMensual) : null;

  return {
    subtotalImplementacion: subtotal,
    descuento,
    baseImplementacion: baseImpl,
    igvImplementacion: igvImpl,
    totalImplementacion: r2(baseImpl + igvImpl),
    baseMensual,
    igvMensual,
    totalMensual: r2(baseMensual + igvMensual),
    valorPrimerAnio: r2(baseImpl + baseMensual * 12),
    semanas: fases.reduce((s, f) => s + (Number.isFinite(f.semanas) ? f.semanas : 0), 0),
    paybackMeses: ret?.payback ?? null,
    roi12Meses: ret?.roi ?? null,
  };
}
