import { Container } from "@/components/ui/container";

export function AboutWelcome() {
  return (
    <section className="bg-paper py-24">
      <Container className="grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
        <div className="rounded-2xl bg-ink-950 p-8 sm:p-10">
          <p className="text-xs font-medium text-signal-400">Bienvenido a DDS</p>
          <p className="mt-4 font-display text-2xl font-bold leading-snug text-paper sm:text-[1.75rem]">
            Somos DDS:{" "}
            <span className="text-signal-400">tecnología con propósito</span>,{" "}
            <span className="text-signal-400">soluciones con impacto</span>.
            En Data Discovery Solutions, combinamos{" "}
            <span className="text-brass-300">experiencia, pasión</span> y
            herramientas de{" "}
            <span className="text-brass-300">última generación</span> para
            ayudarte a tomar mejores decisiones, automatizar tus procesos y{" "}
            <span className="text-signal-400">
              liberar el verdadero potencial de tus datos
            </span>
            .
          </p>
        </div>

        <div className="flex flex-col gap-8">
          <p className="leading-relaxed text-slate">
            Integramos herramientas como Power BI, Qlik, Looker, Rocketbot y
            GPT-4 en soluciones prácticas y escalables, hechas a la medida de
            cada negocio. Trabajamos con organizaciones de los sectores
            educativo, hotelero, financiero, de seguros, minero y
            tecnológico, entregando resultados medibles.
          </p>

          <div>
            <h2 className="font-display text-xl font-bold text-ink-950">
              Nuestro compromiso en DDS
            </h2>
            <p className="mt-3 leading-relaxed text-slate">
              Nacimos para cerrar la brecha entre la tecnología y las
              necesidades reales del negocio. Nos posicionamos como socios
              estratégicos que acompañan a nuestros clientes durante toda su
              transformación digital, diseñando soluciones a medida que
              combinan datos, automatización e IA con empatía y eficiencia.
            </p>
          </div>

          <div className="border-t border-line pt-6">
            <h3 className="font-display text-lg font-bold text-ink-950">
              ¿Por qué elegir Data Discovery Solutions?
            </h3>
            <p className="mt-3 leading-relaxed text-slate">
              En DDS no solo implementamos tecnología: nos convertimos en tu
              aliado estratégico. Nuestro objetivo es conocer a fondo tu
              negocio, optimizar tus procesos con soluciones de analítica,
              automatización e inteligencia artificial y ayudarte a tomar
              decisiones con la información que realmente importa.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
