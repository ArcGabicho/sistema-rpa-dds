import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { RecordStrip } from "@/components/sections/record-strip";
import { SERVICES } from "@/lib/services-data";

export function ServicesOverview() {
  return (
    <section id="servicios" className="scroll-mt-20 bg-paper py-24 lg:scroll-mt-28">
      <Container>
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
            Automatiza, analiza y decide mejor con soluciones hechas a tu
            medida
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate">
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
                className="grid scroll-mt-20 gap-4 border-b border-line py-10 sm:grid-cols-[0.9fr_1.5fr] sm:gap-10 lg:scroll-mt-28 lg:grid-cols-[0.7fr_1.3fr]"
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-brass-500" strokeWidth={1.75} />
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink-950">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate">
                      {service.description}
                    </p>
                    <Link
                      href={`/${service.slug}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brass-500"
                    >
                      Ver detalle
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm text-ink-800">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brass-400" />
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
