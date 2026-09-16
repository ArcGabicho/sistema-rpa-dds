import { Container } from "@/components/ui/container";
import { StatCounter } from "@/components/ui/stat-counter";
import { CLIENTS } from "@/lib/clients";

export function LogoCloud() {
  return (
    <section className="border-y border-line bg-mist py-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <h2 className="font-display text-2xl font-bold leading-snug tracking-tight text-ink-950 sm:text-3xl">
            Suite integral de soluciones para digitalizar y transformar tu
            negocio
          </h2>

          <dl className="flex gap-10 sm:gap-14">
            <div>
              <dt className="font-display text-4xl font-extrabold text-ink-950">
                <StatCounter target={30} suffix="+" />
              </dt>
              <dd className="mt-1 max-w-[10rem] text-sm text-slate">
                empresas confiaron en nuestras soluciones
              </dd>
            </div>
            <div>
              <dt className="font-display text-4xl font-extrabold text-ink-950">
                <StatCounter target={97} suffix="%" />
              </dt>
              <dd className="mt-1 max-w-[10rem] text-sm text-slate">
                de satisfacción con los proyectos entregados
              </dd>
            </div>
          </dl>
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-10 gap-y-3 border-t border-line pt-8">
          {CLIENTS.map((name) => (
            <li key={name} className="text-sm font-medium text-ink-800/70">
              {name}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
