import { Container } from "@/components/ui/container";
import { StatCounter } from "@/components/ui/stat-counter";
import { CLIENTS } from "@/lib/clients";

export function LogoCloud() {
  return (
    <section className="border-b border-line bg-brand-50 py-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <h2 className="font-display text-2xl font-semibold leading-snug tracking-tight text-ink-950 sm:text-3xl">
            Suite integral de soluciones para digitalizar y transformar tu
            negocio
          </h2>

          <dl className="flex gap-10 sm:gap-14">
            <div>
              <dt className="font-display text-4xl font-semibold text-ink-950">
                <StatCounter target={30} suffix="+" />
              </dt>
              <dd className="mt-1 max-w-[10rem] text-sm text-ink-700">
                empresas confiaron en nuestras soluciones
              </dd>
            </div>
            <div>
              <dt className="font-display text-4xl font-semibold text-ink-950">
                <StatCounter target={97} suffix="%" />
              </dt>
              <dd className="mt-1 max-w-[10rem] text-sm text-ink-700">
                de satisfacción con los proyectos entregados
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-12 border-t border-line pt-8">
          <p className="text-sm text-ink-500">Empresas que confían en nosotros</p>
          <ul className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
            {CLIENTS.map((name) => (
              <li key={name} className="text-sm font-medium text-ink-700">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
