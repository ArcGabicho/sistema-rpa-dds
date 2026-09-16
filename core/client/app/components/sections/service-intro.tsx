import { Container } from "@/components/ui/container";
import type { Service } from "@/lib/services-data";

export function ServiceIntro({ service }: { service: Service }) {
  return (
    <section className="bg-ink-950 py-20">
      <Container className="max-w-3xl">
        <h2 className="font-display text-2xl font-bold leading-snug text-paper sm:text-3xl">
          {service.introHeading}
        </h2>
        <div className="mt-6 flex flex-col gap-4 text-paper-dim">
          {service.introBody.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </Container>
    </section>
  );
}
