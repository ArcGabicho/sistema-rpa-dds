import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import type { Service } from "@/lib/services-data";

export function ServicePillars({ service }: { service: Service }) {
  return (
    <section className="bg-ink-950 py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <h2 className="font-display text-2xl font-bold leading-snug text-paper sm:text-3xl">
            {service.pillarsHeading}
          </h2>
          <p className="leading-relaxed text-paper-dim">{service.pillarsIntro}</p>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-10 border-t border-ink-800 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {service.pillars.map((pillar) => (
            <div key={pillar.title}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal-400/15 text-signal-400">
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <h3 className="mt-4 font-display text-base font-bold text-paper">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
