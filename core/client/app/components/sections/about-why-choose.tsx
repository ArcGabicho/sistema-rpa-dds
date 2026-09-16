import { Container } from "@/components/ui/container";
import { WHY_CHOOSE } from "@/lib/why-choose";

export function AboutWhyChoose() {
  return (
    <section className="bg-paper py-24">
      <Container>
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
            ¿Por qué elegir Data Discovery Solutions?
          </h2>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_CHOOSE.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col">
              <Icon className="h-6 w-6 text-brass-500" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-lg font-bold leading-snug text-ink-950">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
