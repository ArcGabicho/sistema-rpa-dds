import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { StatCounter } from "@/components/ui/stat-counter";
import { CLIENTS } from "@/lib/clients";

// azure.com-style customer wall. We have names, not logo files, so each
// tile carries the company name rather than a placeholder mark.
export function LogoCloud() {
  return (
    <section className="py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <Eyebrow>Confían en nosotros</Eyebrow>
            <h2 className="mt-3 text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-ink-950 sm:text-4xl">
              Suite integral de soluciones para digitalizar y transformar tu
              negocio
            </h2>
          </div>

          <dl className="flex gap-12 lg:justify-end">
            <div>
              <dt className="font-display text-5xl font-semibold tracking-tight text-brand-700">
                <StatCounter target={30} suffix="+" />
              </dt>
              <dd className="mt-1 max-w-[10rem] text-sm text-ink-700">
                empresas confiaron en nuestras soluciones
              </dd>
            </div>
            <div>
              <dt className="font-display text-5xl font-semibold tracking-tight text-brand-700">
                <StatCounter target={97} suffix="%" />
              </dt>
              <dd className="mt-1 max-w-[10rem] text-sm text-ink-700">
                de satisfacción con los proyectos entregados
              </dd>
            </div>
          </dl>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {CLIENTS.map((name) => (
            <li
              key={name}
              className="flex h-16 items-center justify-center rounded-md border border-line bg-white px-3 text-center text-sm font-semibold text-ink-700"
            >
              {name}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
