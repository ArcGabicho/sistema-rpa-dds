import type { Calculo, ProcesoInput } from "@/lib/diagnostico";

// The diagnosis math, mirroring core/server/Services/Roi.cs, for the
// process form's live preview. What gets saved and shown comes from the API.

export const HORAS_POR_FTE = 160;
export const FACTIBILIDAD_ALTA = 60;
export const RETORNO_RAPIDO_MESES = 12;

const redondear = (value: number, decimales: number) => Math.round(value * 10 ** decimales) / 10 ** decimales;

export function factibilidad(p: Pick<ProcesoInput, "reglasClaras" | "datosDigitales" | "sistemasEstables" | "procesoEstandar" | "pocasExcepciones">) {
  const promedio = (p.reglasClaras + p.datosDigitales + p.sistemasEstables + p.procesoEstandar + p.pocasExcepciones) / 5;
  return Math.round(((promedio - 1) / 4) * 100);
}

export function retorno(ahorroMensual: number, costoImplementacion: number, costoMensual: number) {
  const costoPrimerAnio = costoImplementacion + costoMensual * 12;
  const roi = costoPrimerAnio > 0 ? redondear((ahorroMensual * 12 - costoPrimerAnio) / costoPrimerAnio, 3) : null;
  const neto = ahorroMensual - costoMensual;
  const payback = neto > 0 ? redondear(costoImplementacion / neto, 1) : null;
  return { costoPrimerAnio: redondear(costoPrimerAnio, 2), roi, payback };
}

export function cuadrante(fact: number, paybackMeses: number | null) {
  const factible = fact >= FACTIBILIDAD_ALTA;
  const rapido = paybackMeses !== null && paybackMeses <= RETORNO_RAPIDO_MESES;
  if (factible && rapido) return "quick_win";
  if (rapido) return "estrategico";
  if (factible) return "mejora_menor";
  return "postergar";
}

export function calcular(p: ProcesoInput, costoHoraDiagnostico: number): Calculo {
  const costoHora = p.costoHora ?? costoHoraDiagnostico;
  const horasMes = (p.ejecucionesMes * p.minutosPorEjecucion) / 60;
  const liberadas = (horasMes * p.porcentajeAutomatizable) / 100;
  const ahorroMensual = liberadas * costoHora;
  const fact = factibilidad(p);
  const { costoPrimerAnio, roi, payback } = retorno(ahorroMensual, p.costoImplementacion, p.costoMensual);
  return {
    horasMes: redondear(horasMes, 1),
    horasLiberadasMes: redondear(liberadas, 1),
    fte: redondear(liberadas / HORAS_POR_FTE, 2),
    ahorroMensual: redondear(ahorroMensual, 2),
    ahorroAnual: redondear(ahorroMensual * 12, 2),
    costoPrimerAnio,
    roi12Meses: roi,
    paybackMeses: payback,
    factibilidad: fact,
    cuadrante: cuadrante(fact, payback),
  };
}
