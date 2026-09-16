import { Container } from "@/components/ui/container";

export function VisionStatement() {
  return (
    <section className="bg-ink-950 py-24">
      <Container className="max-w-3xl">
        <span className="inline-flex items-center rounded-full border border-ink-800 px-4 py-1.5 text-xs font-medium text-paper">
          Nuestra Visión y Propósito
        </span>
        <p className="mt-6 font-display text-2xl font-bold leading-snug text-paper sm:text-3xl">
          Equilibramos los desafíos de hoy con la visión del mañana.
        </p>
        <div className="mt-6 flex flex-col gap-4 text-paper-dim">
          <p className="leading-relaxed">
            En Data Discovery Solutions, acompañamos a organizaciones que
            buscan crecer de manera sostenible, superando retos operativos y
            transformando su cultura con tecnología estratégica. Nuestros
            logros están cimentados en la colaboración profunda con nuestros
            clientes y en un equipo diverso, comprometido y en constante
            evolución.
          </p>
          <p className="leading-relaxed">
            Contamos con especialistas altamente capacitados en analítica,
            automatización e inteligencia artificial, que aplican
            conocimiento real para diseñar soluciones escalables, adaptadas
            a cada presupuesto y objetivo de negocio.
          </p>
        </div>
      </Container>
    </section>
  );
}
