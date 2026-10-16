import { FacadeBackdrop } from "@/components/layout/facade-backdrop";
import { Container } from "@/components/ui/container";
import { PRIVACY_LAST_UPDATED } from "@/lib/privacy-data";

export function PrivacyHero() {
  return (
    <section className="relative overflow-hidden pt-14 pb-16 lg:pt-20 lg:pb-24">
      <FacadeBackdrop tone="light" />
      <Container className="relative text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">
          Políticas de Privacidad
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          Última actualización: {PRIVACY_LAST_UPDATED}
        </p>
      </Container>
    </section>
  );
}
