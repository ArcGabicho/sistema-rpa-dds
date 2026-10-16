import { ActionLink } from "@/components/ui/action-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CASE_STUDIES } from "@/lib/case-studies";
import { SITE } from "@/lib/site-config";

export function CaseStudies() {
  return (
    <section id="casos" className="scroll-mt-24 bg-brand-50 py-24">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>Proyectos destacados</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
              Casos reales de transformación digital
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-700">
              Hemos ayudado a diversas empresas a optimizar sus procesos,
              automatizar tareas críticas y tomar decisiones con datos en
              tiempo real.
            </p>
          </div>
          <ActionLink href={SITE.portfolioUrl} external className="shrink-0">
            Ver todos los casos de éxito
          </ActionLink>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CASE_STUDIES.map((study) => (
            <li
              key={study.title}
              className="flex flex-col rounded-lg bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex flex-wrap gap-2">
                {study.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-ink-950">
                {study.title}
              </h3>
              {study.teaser && (
                <p className="mt-2 text-sm leading-relaxed text-ink-700">{study.teaser}</p>
              )}
              <ActionLink href={SITE.portfolioUrl} external className="mt-auto pt-6">
                Revisar caso
              </ActionLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
