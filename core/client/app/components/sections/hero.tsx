import Link from "next/link";
import { Container } from "@/components/ui/container";
import { FacadeBackdrop } from "@/components/layout/facade-backdrop";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SITE } from "@/lib/site-config";

export function Hero() {
  return (
    <section id="top" className="relative scroll-mt-24 overflow-hidden pt-14 pb-20 lg:pt-20 lg:pb-24">
      <FacadeBackdrop tone="light" />

      <Container className="relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-2xl">
          <Eyebrow>Automatiza. Analiza. Transforma.</Eyebrow>
          <h1 className="mt-5 text-balance font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink-950 sm:text-6xl">
            Soluciones inteligentes en Analítica, RPA e IA
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-700">
            Más de 30 organizaciones ya confían en nosotros para transformar
            sus operaciones y potenciar su crecimiento.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#servicios"
              className="inline-flex h-11 items-center rounded-md bg-brand-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-900"
            >
              Explorar servicios
            </a>
            <Link
              href={SITE.contactUrl}
              className="inline-flex h-11 items-center rounded-md border border-ink-950 bg-white px-6 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-50"
            >
              Solicitar diagnóstico
            </Link>
          </div>

          <p className="mt-12 max-w-md text-sm leading-relaxed text-ink-500">
            Trabajamos con Power BI, Qlik, Looker, Rocketbot y modelos de
            lenguaje (LLM).
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/hero-porada.svg"
            alt=""
            className="w-full max-w-md lg:max-w-none"
          />
        </div>
      </Container>
    </section>
  );
}
