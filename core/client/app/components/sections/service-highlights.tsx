import { Container } from "@/components/ui/container";
import type { Service } from "@/lib/services-data";

export function ServiceHighlights({ service }: { service: Service }) {
  return (
    <section className="bg-paper py-20">
      <Container>
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
          {service.highlights.map((highlight) => (
            <div key={highlight.title} className="border-t-2 border-brass-400 pt-5">
              <h3 className="font-display text-base font-bold text-ink-950">
                {highlight.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
