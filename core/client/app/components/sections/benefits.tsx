import { Container } from "@/components/ui/container";
import { BENEFITS } from "@/lib/benefits";

export function Benefits() {
  return (
    <section id="beneficios" className="scroll-mt-20 bg-paper py-24 lg:scroll-mt-28">
      <Container>
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
            ¿Por qué elegir Data Discovery Solutions?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate">
            Aceleramos la eficiencia de tus procesos con analítica avanzada,
            automatización y soluciones inteligentes.
          </p>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
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
