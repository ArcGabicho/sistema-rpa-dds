import { Container } from "@/components/ui/container";
import { CASE_STUDIES } from "@/lib/case-studies";
import { SITE } from "@/lib/site-config";

export function CaseStudies() {
  return (
    <section className="bg-mist py-24">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-brass-500">
              Nuestros proyectos destacados
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
              Casos reales de transformación digital
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate">
              Hemos ayudado a diversas empresas a optimizar sus procesos,
              automatizar tareas críticas y tomar decisiones con datos en
              tiempo real.
            </p>
          </div>
          <a
            href={SITE.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-medium text-brass-500 underline decoration-brass-300 underline-offset-4 hover:decoration-brass-500"
          >
            Ver todos los casos de éxito
          </a>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {CASE_STUDIES.map((study) => (
            <a
              key={study.title}
              href={SITE.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col rounded-2xl border border-line bg-paper p-7 transition-colors hover:border-brass-400"
            >
              <div className="flex flex-wrap gap-2">
                {study.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-ink-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink-950">
                {study.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate">
                {study.teaser}
              </p>
              <span className="mt-5 text-sm font-medium text-brass-500">
                Revisar caso
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
