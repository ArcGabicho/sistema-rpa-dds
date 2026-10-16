import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { INDUSTRIES } from "@/lib/industries";

export function Industries() {
  return (
    <section id="sectores" className="scroll-mt-24 bg-brand-50 py-24">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>Sectores</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            Soluciones inteligentes para cada sector
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-700">
            Desde instituciones educativas hasta grandes cadenas hoteleras o
            entidades públicas, adaptamos nuestras soluciones tecnológicas
            para maximizar eficiencia, ahorro y toma de decisiones.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {INDUSTRIES.map(({ icon: Icon, name, description }) => (
            <div key={name} className="rounded-lg bg-white p-5 shadow-card">
              <Icon className="h-6 w-6 text-brand-600" strokeWidth={1.75} />
              <h3 className="mt-4 text-base font-semibold text-ink-950">{name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
