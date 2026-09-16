import { Container } from "@/components/ui/container";
import { INDUSTRIES } from "@/lib/industries";

export function Industries() {
  return (
    <section className="bg-mist py-24">
      <Container>
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
            Soluciones inteligentes para cada sector
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate">
            Desde instituciones educativas hasta grandes cadenas hoteleras o
            entidades públicas, adaptamos nuestras soluciones tecnológicas
            para maximizar eficiencia, ahorro y toma de decisiones.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {INDUSTRIES.map(({ icon: Icon, name, description }) => (
            <div key={name}>
              <Icon className="h-5 w-5 text-brass-500" strokeWidth={1.75} />
              <h3 className="mt-3 text-sm font-semibold text-ink-950">{name}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
