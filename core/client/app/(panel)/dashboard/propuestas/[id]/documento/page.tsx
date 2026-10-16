import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ImprimirButton } from "@/components/diagnostico/imprimir-button";
import { apiGet } from "@/lib/api";
import { formatPayback, formatPorcentaje } from "@/lib/diagnostico";
import { formatDate, formatDay } from "@/lib/format-date";
import { formatMoneda, type Propuesta } from "@/lib/propuesta";
import { SITE } from "@/lib/site-config";

function Lineas({ texto }: { texto: string | null }) {
  const lineas = texto?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  if (lineas.length === 0) return null;
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5">
      {lineas.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}

function Seccion({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 break-inside-avoid">
      <h2 className="text-lg font-semibold text-ink-950">
        <span className="mr-2 text-brand-700">{numero}.</span>
        {titulo}
      </h2>
      <div className="mt-3 text-sm leading-relaxed text-ink-700">{children}</div>
    </section>
  );
}

// The proposal as the client receives it: print it or save it as PDF.
export default async function DocumentoPropuestaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await apiGet<Propuesta>(`propuestas/${id}`);
  if (!p) notFound();

  const m = (v: number) => formatMoneda(v, p.moneda, 2);
  const implementacion = p.items.filter((i) => i.tipo === "implementacion");
  const mensual = p.items.filter((i) => i.tipo === "mensual");
  const totalSemanas = Math.max(p.totales.semanas, 1);
  // Phases run back to back: each starts where the previous ones end.
  const inicios = p.fases.map((_, k) => p.fases.slice(0, k).reduce((s, f) => s + f.semanas, 0));
  const conRetorno = p.ahorroAnualEstimado !== null && p.ahorroAnualEstimado > 0;
  // Sections are numbered in order, skipping the ones without content.
  const secciones = [
    p.introduccion && "contexto",
    "alcance",
    p.fases.length > 0 && "cronograma",
    "inversion",
    conRetorno && "retorno",
    "condiciones",
  ].filter(Boolean);
  const numero = (seccion: string) => secciones.indexOf(seccion) + 1;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <Link href={`/dashboard/propuestas/${p.id}`} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-950">
          <ArrowLeft className="h-4 w-4" />
          Volver a la propuesta
        </Link>
        <ImprimirButton />
      </div>

      <article className="rounded-lg bg-white p-8 shadow-card sm:p-12 print:rounded-none print:p-0 print:shadow-none">
        {p.estado === "borrador" && (
          <p className="mb-6 rounded-md border border-dashed border-line px-4 py-2 text-center text-xs font-semibold tracking-wide text-ink-500 uppercase">
            Borrador — aún no enviado al cliente
          </p>
        )}

        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8 print:flex-nowrap">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Propuesta técnica y económica</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950">{p.titulo}</h1>
            <p className="mt-2 text-sm text-ink-700">
              Para <span className="font-semibold text-ink-950">{p.empresaRazonSocial ?? p.empresaNombre}</span>
              {p.empresaRuc && <span className="text-ink-500"> · RUC {p.empresaRuc}</span>}
            </p>
            {p.contactoNombre && (
              <p className="text-sm text-ink-500">
                Atención: {p.contactoNombre}
                {p.contactoCargo && `, ${p.contactoCargo}`}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right text-sm text-ink-500">
            <div className="flex items-center justify-end gap-2">
              <Image src="/assets/icon.png" alt="" width={24} height={24} className="h-6 w-6" />
              <span className="font-display font-semibold text-ink-950">{SITE.name}</span>
            </div>
            <p className="mt-2 font-mono text-xs">
              {p.codigo} · versión {p.version}
            </p>
            <p>{formatDate(p.enviadaAtUtc ?? p.updatedAtUtc)}</p>
            {p.validaHasta && <p>Válida hasta el {formatDay(p.validaHasta)}</p>}
          </div>
        </header>

        {p.introduccion && (
          <Seccion numero={numero("contexto")} titulo="Contexto">
            <p className="whitespace-pre-line">{p.introduccion}</p>
          </Seccion>
        )}

        <Seccion numero={numero("alcance")} titulo="Alcance">
          <ol className="flex flex-col gap-3">
            {implementacion.map((i, k) => (
              <li key={k} className="break-inside-avoid">
                <p className="font-semibold text-ink-950">{i.descripcion}</p>
                {i.detalle && <p className="text-ink-700">{i.detalle}</p>}
              </li>
            ))}
          </ol>
          {mensual.length > 0 && (
            <>
              <p className="mt-5 font-semibold text-ink-950">Servicio mensual</p>
              <ul className="mt-1 flex flex-col gap-2">
                {mensual.map((i, k) => (
                  <li key={k}>
                    <span className="font-medium text-ink-950">{i.descripcion}</span>
                    {i.detalle && <span className="text-ink-700">: {i.detalle}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Seccion>

        {p.fases.length > 0 && (
          <Seccion numero={numero("cronograma")} titulo={`Cronograma (${p.totales.semanas} semanas)`}>
            <ol className="flex flex-col gap-2.5">
              {p.fases.map((f, k) => {
                const inicio = inicios[k]!;
                return (
                  <li key={k} className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)] items-center gap-4 break-inside-avoid">
                    <div>
                      <p className="font-medium text-ink-950">{f.nombre}</p>
                      <p className="text-xs text-ink-500">
                        Semana {inicio + 1}
                        {f.semanas > 1 && ` a ${inicio + f.semanas}`}
                      </p>
                    </div>
                    <div className="relative h-3 rounded-full bg-brand-50">
                      <div
                        className="absolute inset-y-0 rounded-full bg-brand-600"
                        style={{ left: `${(inicio / totalSemanas) * 100}%`, width: `${(f.semanas / totalSemanas) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </Seccion>
        )}

        <Seccion numero={numero("inversion")} titulo="Inversión">
          <table className="w-full text-left">
            <thead className="border-b border-line text-xs text-ink-500">
              <tr>
                <th className="py-2 font-medium">Implementación</th>
                <th className="py-2 text-right font-medium">Cant.</th>
                <th className="py-2 text-right font-medium">Precio</th>
                <th className="py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {implementacion.map((i, k) => (
                <tr key={k} className="break-inside-avoid">
                  <td className="py-2 pr-3 text-ink-950">{i.descripcion}</td>
                  <td className="py-2 text-right tabular-nums">{i.cantidad}</td>
                  <td className="py-2 text-right whitespace-nowrap tabular-nums">{m(i.precioUnitario)}</td>
                  <td className="py-2 text-right whitespace-nowrap tabular-nums text-ink-950">{m(i.cantidad * i.precioUnitario)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="text-ink-950">
              {p.totales.descuento > 0 && (
                <>
                  <tr className="border-t border-line">
                    <td colSpan={3} className="py-1.5 text-right text-ink-500">Subtotal</td>
                    <td className="py-1.5 text-right tabular-nums">{m(p.totales.subtotalImplementacion)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1.5 text-right text-ink-500">Descuento ({p.descuentoPorcentaje} %)</td>
                    <td className="py-1.5 text-right tabular-nums">−{m(p.totales.descuento)}</td>
                  </tr>
                </>
              )}
              <tr className="border-t border-line">
                <td colSpan={3} className="py-1.5 text-right text-ink-500">Valor de venta</td>
                <td className="py-1.5 text-right tabular-nums">{m(p.totales.baseImplementacion)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="py-1.5 text-right text-ink-500">IGV (18 %)</td>
                <td className="py-1.5 text-right tabular-nums">{m(p.totales.igvImplementacion)}</td>
              </tr>
              <tr className="border-t border-ink-950 font-semibold">
                <td colSpan={3} className="py-2 text-right">Total implementación</td>
                <td className="py-2 text-right whitespace-nowrap tabular-nums">{m(p.totales.totalImplementacion)}</td>
              </tr>
            </tfoot>
          </table>

          {mensual.length > 0 && (
            <table className="mt-6 w-full text-left">
              <thead className="border-b border-line text-xs text-ink-500">
                <tr>
                  <th className="py-2 font-medium">Servicio mensual</th>
                  <th className="py-2 text-right font-medium">Al mes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {mensual.map((i, k) => (
                  <tr key={k}>
                    <td className="py-2 pr-3 text-ink-950">{i.descripcion}</td>
                    <td className="py-2 text-right whitespace-nowrap tabular-nums">{m(i.cantidad * i.precioUnitario)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-ink-950">
                <tr className="border-t border-line">
                  <td className="py-1.5 text-right text-ink-500">IGV (18 %)</td>
                  <td className="py-1.5 text-right tabular-nums">{m(p.totales.igvMensual)}</td>
                </tr>
                <tr className="border-t border-ink-950 font-semibold">
                  <td className="py-2 text-right">Total mensual</td>
                  <td className="py-2 text-right whitespace-nowrap tabular-nums">{m(p.totales.totalMensual)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </Seccion>

        {conRetorno && (
          <Seccion numero={numero("retorno")} titulo="Retorno estimado">
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-line ring-1 ring-line">
              {[
                ["Ahorro anual estimado", formatMoneda(p.ahorroAnualEstimado!, p.moneda)],
                ["Recuperación de la inversión", formatPayback(p.totales.paybackMeses)],
                ["ROI a 12 meses", formatPorcentaje(p.totales.roi12Meses)],
              ].map(([label, value]) => (
                <div key={label} className="bg-white p-4">
                  <p className="text-xs text-ink-500">{label}</p>
                  <p className="mt-1 font-display text-xl font-semibold text-ink-950">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-500">
              Estimación a partir de los volúmenes y tiempos levantados con su equipo
              {p.diagnosticoTitulo && ` en el diagnóstico «${p.diagnosticoTitulo}»`}; la recuperación descuenta el servicio mensual
              del ahorro.
            </p>
          </Seccion>
        )}

        <Seccion numero={numero("condiciones")} titulo="Condiciones">
          {p.condicionesPago && (
            <p>
              <span className="font-semibold text-ink-950">Forma de pago:</span> {p.condicionesPago}
            </p>
          )}
          <p className="mt-2">
            <span className="font-semibold text-ink-950">Precios:</span> en {p.moneda === "USD" ? "dólares americanos" : "soles"}, IGV
            indicado por separado.
            {p.validaHasta && ` Esta propuesta es válida hasta el ${formatDay(p.validaHasta)}.`}
          </p>
          {p.supuestos && (
            <>
              <p className="mt-4 font-semibold text-ink-950">Supuestos</p>
              <Lineas texto={p.supuestos} />
            </>
          )}
          {p.exclusiones && (
            <>
              <p className="mt-4 font-semibold text-ink-950">No incluye</p>
              <Lineas texto={p.exclusiones} />
            </>
          )}
        </Seccion>

        <section className="mt-12 grid auto-rows-[9rem] gap-10 border-t border-line pt-8 text-sm break-inside-avoid sm:grid-cols-2 print:grid-cols-2">
          {[
            { por: p.empresaRazonSocial ?? p.empresaNombre, quien: p.contactoNombre },
            { por: "Data Discovery Solutions S.A.C.", quien: p.responsableNombre },
          ].map((firma) => (
            // The name may take two lines: the signature line stays at the bottom, level on both sides.
            <div key={firma.por} className="flex flex-col">
              <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Aceptación</p>
              <p className="mt-1 font-semibold text-ink-950">{firma.por}</p>
              <div className="mt-auto border-t border-ink-400 pt-2 text-xs text-ink-500">
                {firma.quien ?? "Nombre"} · Firma y fecha
              </div>
            </div>
          ))}
        </section>
      </article>
    </div>
  );
}
