import { ActionLink } from "@/components/ui/action-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RecordStrip } from "@/components/sections/record-strip";
import { SERVICES } from "@/lib/services-data";

export function ServicesOverview() {
  return (
    <section id="servicios" className="scroll-mt-24 bg-white py-24">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>Servicios</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            Automatiza, analiza y decide mejor con soluciones hechas a tu
            medida
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-700">
            Desarrollamos soluciones con datos, automatización e IA que
            impulsan decisiones inteligentes y procesos eficientes.
          </p>
        </div>

        <div className="mt-14 flex flex-col border-t border-line">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.slug}
                id={service.slug}
                className="grid scroll-mt-24 gap-4 border-b border-line py-10 sm:grid-cols-[0.9fr_1.5fr] sm:gap-10 lg:grid-cols-[0.7fr_1.3fr]"
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-brand-600" strokeWidth={1.75} />
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink-950">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-700">
                      {service.description}
                    </p>
                    <ActionLink href={`/${service.slug}`} className="mt-4">
                      Ver detalle
                    </ActionLink>
                  </div>
                </div>

                <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm text-ink-700">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-16">
          <RecordStrip />
        </div>
      </Container>
    </section>
  );
}
