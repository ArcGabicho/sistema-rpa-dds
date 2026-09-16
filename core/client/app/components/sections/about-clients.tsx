import { Container } from "@/components/ui/container";
import { CLIENTS } from "@/lib/clients";

export function AboutClients() {
  return (
    <section className="bg-mist py-16">
      <Container>
        <p className="text-sm text-slate">
          Empresas que ya confían en Data Discovery Solutions
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
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
