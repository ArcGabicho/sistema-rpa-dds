import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/site-config";

export function Hero() {
  return (
    <section id="top" className="scroll-mt-20 overflow-hidden bg-paper py-20 lg:scroll-mt-28 lg:py-28">
      <Container className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brass-500">
            Automatiza. Analiza. Transforma.
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ink-950 sm:text-5xl">
            Soluciones inteligentes en Analítica, RPA e IA
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate">
            Más de 30 organizaciones ya confían en nosotros para transformar
            sus operaciones y potenciar su crecimiento.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#servicios"
              className="inline-flex items-center rounded-full bg-brass-500 px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-brass-600"
            >
              Explorar servicios
            </a>
            <Link
              href={SITE.contactUrl}
              className="inline-flex items-center text-sm font-medium text-ink-950 underline decoration-line underline-offset-4 transition-colors hover:decoration-brass-400"
            >
              Solicitar diagnóstico
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-porada.svg"
            alt=""
            className="w-full max-w-md lg:max-w-none"
          />
        </div>
      </Container>
    </section>
  );
}
