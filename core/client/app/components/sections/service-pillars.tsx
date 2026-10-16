import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import type { Service } from "@/lib/services-data";

export function ServicePillars({ service }: { service: Service }) {
  return (
    <section className="bg-ink-950 py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <h2 className="font-display text-2xl font-semibold leading-snug text-white sm:text-3xl">
            {service.pillarsHeading}
          </h2>
          <p className="leading-relaxed text-white/70">{service.pillarsIntro}</p>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-10 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {service.pillars.map((pillar) => (
            <div key={pillar.title}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-glow-300/15 text-glow-300">
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-white">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
