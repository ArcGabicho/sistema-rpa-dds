import { Container } from "@/components/ui/container";
import { PRIVACY_LAST_UPDATED } from "@/lib/privacy-data";

export function PrivacyHero() {
  return (
    <section className="bg-ink-950 py-16">
      <Container className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-paper sm:text-4xl">
          Políticas de Privacidad
        </h1>
        <p className="mt-3 text-sm text-paper-dim">
          Última actualización: {PRIVACY_LAST_UPDATED}
        </p>
      </Container>
    </section>
  );
}
