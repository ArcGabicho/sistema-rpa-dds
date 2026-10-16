import { Container } from "@/components/ui/container";
import type { Service } from "@/lib/services-data";

export function ServiceIntro({ service }: { service: Service }) {
  return (
    <section className="bg-ink-950 py-20">
      <Container className="max-w-3xl">
        <h2 className="font-display text-2xl font-semibold leading-snug text-white sm:text-3xl">
          {service.introHeading}
        </h2>
        <div className="mt-6 flex flex-col gap-4 text-white/70">
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
