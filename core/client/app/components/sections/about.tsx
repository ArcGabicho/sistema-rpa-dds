import Link from "next/link";
import { StatCounter } from "@/components/ui/stat-counter";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/site-config";

export function About() {
  return (
    <section id="nosotros" className="scroll-mt-24 bg-white py-24">
      <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
        <div>
          <p className="font-display text-6xl font-semibold text-ink-950">
            <StatCounter target={10} suffix="+" />
          </p>
          <p className="mt-2 max-w-[14rem] text-sm text-ink-700">
            años de experiencia transformando procesos con tecnología
          </p>
        </div>

        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            Haz crecer tu empresa con soluciones inteligentes en datos,
            automatización e IA
          </h2>

          <div className="mt-6 flex flex-col gap-4 text-ink-700">
            <p className="leading-relaxed">
              Desde hace más de 10 años, en Data Discovery Solutions
              acompañamos a empresas de distintos rubros a transformar sus
              procesos con tecnologías como Power BI, Qlik, Looker, Rocketbot
              e IA. Nuestras soluciones conectan datos, automatizan tareas
              críticas y potencian la toma de decisiones estratégicas.
            </p>
            <p className="leading-relaxed">
              Nuestro enfoque va más allá del software. Creamos soluciones a
              medida que integran automatización (RPA), analítica de datos y
              modelos de IA, ayudando a equipos de finanzas, operaciones y
              gestión a trabajar con mayor eficiencia y claridad.
            </p>
            <p className="leading-relaxed">
              Nuestra historia comenzó en Perú con una misión clara:
              democratizar el acceso a tecnologías analíticas de alto
              impacto. Hoy trabajamos con empresas medianas y grandes,
              brindando soluciones ágiles y soporte experto.
            </p>
          </div>

          <Link
            href={SITE.aboutUrl}
            className="mt-6 inline-flex items-center text-sm font-medium text-ink-950 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700"
          >
            Más sobre nosotros
          </Link>
        </div>
      </Container>
    </section>
  );
}
