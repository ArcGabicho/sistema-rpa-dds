import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CASE_STUDIES } from "@/lib/case-studies";
import { SITE } from "@/lib/site-config";

export function CaseStudies() {
  return (
    <section className="bg-brand-50 py-24">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-brand-700">
              Nuestros proyectos destacados
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
              Casos reales de transformación digital
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-700">
              Hemos ayudado a diversas empresas a optimizar sus procesos,
              automatizar tareas críticas y tomar decisiones con datos en
              tiempo real.
            </p>
          </div>
          <a
            href={SITE.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-medium text-ink-950 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
          >
            Ver todos los casos de éxito
          </a>
        </div>

        <ol className="mt-12 divide-y divide-line border-y border-line">
          {CASE_STUDIES.map((study, index) => (
            <li key={study.title}>
              <a
                href={SITE.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid grid-cols-[2.5rem_1fr_auto] items-start gap-x-4 gap-y-3 py-6 sm:grid-cols-[3rem_1fr_auto_auto] sm:items-center"
              >
                <span className="pt-1 font-mono text-sm text-ink-400 sm:pt-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-950 group-hover:underline sm:text-xl">
                    {study.title}
                  </h3>
                  {study.teaser && (
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-700">
                      {study.teaser}
                    </p>
                  )}
                </div>
                <div className="col-start-2 row-start-2 flex flex-wrap gap-2 sm:col-start-auto sm:row-start-auto">
                  {study.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <ArrowUpRight className="h-4 w-4 text-ink-400" aria-hidden="true" />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
