import Link from "next/link";
import { Container } from "@/components/ui/container";
import { FacadeBackdrop } from "@/components/layout/facade-backdrop";
import { SITE } from "@/lib/site-config";

export function Hero() {
  return (
    <section id="top" className="relative scroll-mt-24 overflow-hidden pt-32 pb-20 sm:pt-36 lg:pb-28">
      <FacadeBackdrop tone="light" />

      <Container className="relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-700">
            Automatiza. Analiza. Transforma.
          </p>
          <h1 className="mt-5 text-balance font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink-950 sm:text-6xl">
            Soluciones inteligentes en Analítica, RPA e IA
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-700">
            Más de 30 organizaciones ya confían en nosotros para transformar
            sus operaciones y potenciar su crecimiento.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href="#servicios"
              className="inline-flex h-11 items-center rounded-full bg-brand-700 px-6 text-sm font-medium text-white transition-colors hover:bg-ink-900"
            >
              Explorar servicios
            </a>
            <Link
              href={SITE.contactUrl}
              className="text-sm font-medium text-ink-950 underline decoration-brand-300 underline-offset-4 transition-colors hover:decoration-brand-700"
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
