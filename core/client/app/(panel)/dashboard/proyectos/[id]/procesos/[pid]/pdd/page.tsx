import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ImprimirButton } from "@/components/diagnostico/imprimir-button";
import { apiGet } from "@/lib/api";
import { SERVICIO_LABELS } from "@/lib/comercial";
import { formatNumero } from "@/lib/diagnostico";
import { formatDate } from "@/lib/format-date";
import { PDD_ESTADO_LABELS, PDD_SECCIONES, lineas, type ProcesoProyecto } from "@/lib/proyecto";
import { SITE } from "@/lib/site-config";

// The PDD as the client reviews and signs it: print it or save it as PDF.
export default async function PddDocumentoPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  const p = await apiGet<ProcesoProyecto>(`proyectos/procesos/${pid}`);
  if (!p || String(p.proyectoId) !== id) notFound();

  const secciones = PDD_SECCIONES.filter((s) => (p[s.key] ?? "").trim() !== "");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <Link href={`/dashboard/proyectos/${p.proyectoId}/procesos/${p.id}`} className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-950">
          <ArrowLeft className="h-4 w-4" />
          Volver al PDD
        </Link>
        <ImprimirButton />
      </div>

      <article className="rounded-lg bg-white p-8 shadow-card sm:p-12 print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8 print:flex-nowrap">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Documento de definición del proceso (PDD)</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950">{p.nombre}</h1>
            <p className="mt-1 text-sm text-ink-500">
              {p.empresaNombre}
              {p.area && ` · ${p.area}`} · {SERVICIO_LABELS[p.servicio] ?? p.servicio}
            </p>
          </div>
          <div className="shrink-0 text-right text-sm text-ink-500">
            <div className="flex items-center justify-end gap-2">
              <Image src="/assets/icon.png" alt="" width={24} height={24} className="h-6 w-6" />
              <span className="font-display font-semibold text-ink-950">{SITE.name}</span>
            </div>
            <p className="mt-2">
              Versión {p.pddVersion} · {PDD_ESTADO_LABELS[p.pddEstado] ?? p.pddEstado}
            </p>
            <p>{formatDate(p.updatedAtUtc)}</p>
          </div>
        </header>

        {p.ejecucionesMes !== null && (
          <p className="mt-6 rounded-md bg-brand-50 px-4 py-3 text-sm text-ink-700">
            Volumen actual: {formatNumero(p.ejecucionesMes)} ejecuciones al mes de unos {formatNumero(p.minutosPorEjecucion ?? 0)} minutos, a cargo de{" "}
            {p.personas} {p.personas === 1 ? "persona" : "personas"}
            {p.horasLiberadasMes !== null && `; la automatización liberaría unas ${formatNumero(p.horasLiberadasMes)} horas al mes`}.
          </p>
        )}

        {secciones.length === 0 ? (
          <p className="mt-8 text-sm text-ink-500">El PDD aún no tiene contenido.</p>
        ) : (
          secciones.map((s, n) => {
            const items = lineas(p[s.key]);
            return (
              <section key={s.key} className="mt-8 break-inside-avoid">
                <h2 className="text-lg font-semibold text-ink-950">
                  <span className="mr-2 text-brand-700">{n + 1}.</span>
                  {s.label}
                </h2>
                <div className="mt-2 text-sm leading-relaxed text-ink-700">
                  {!s.lista ? (
                    <p className="whitespace-pre-line">{p[s.key]}</p>
                  ) : "numerada" in s && s.numerada ? (
                    <ol className="list-decimal space-y-1 pl-5">
                      {items.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ol>
                  ) : (
                    <ul className="list-disc space-y-1 pl-5">
                      {items.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            );
          })
        )}

        {p.pddConIa && (
          <p className="mt-8 text-xs text-ink-400">El primer borrador de este documento se redactó con IA a partir de las notas del levantamiento y lo revisó el equipo de DDS.</p>
        )}

        <section className="mt-12 grid auto-rows-[8rem] gap-10 border-t border-line pt-8 text-sm break-inside-avoid sm:grid-cols-2 print:grid-cols-2">
          {[
            { por: p.empresaNombre, quien: p.pddAprobadoPor ?? p.contactoNombre, fecha: p.pddAprobadoAtUtc },
            { por: "Data Discovery Solutions S.A.C.", quien: null, fecha: null },
          ].map((firma) => (
            // The name may take two lines: the signature line stays at the bottom, level on both sides.
            <div key={firma.por} className="flex flex-col">
              <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{firma.por === p.empresaNombre ? "Aprobación del cliente" : "Elaborado por"}</p>
              <p className="mt-1 font-semibold text-ink-950">{firma.por}</p>
              <div className="mt-auto border-t border-ink-400 pt-2 text-xs text-ink-500">
                {firma.quien ?? "Nombre"} · {firma.fecha ? `Aprobado el ${formatDate(firma.fecha)}` : "Firma y fecha"}
              </div>
            </div>
          ))}
        </section>
      </article>
    </div>
  );
}
