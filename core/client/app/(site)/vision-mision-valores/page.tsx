import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/sections/page-hero";
import { MissionStatement } from "@/components/sections/mission-statement";
import { CoreValues } from "@/components/sections/core-values";
import { VisionStatement } from "@/components/sections/vision-statement";
import { CtaBanner } from "@/components/sections/cta-banner";

export const metadata: Metadata = {
  title: "Visión, Misión y Valores | Data Discovery Solutions",
  description:
    "No solo implementamos tecnología, construimos confianza y resultados. Conoce la misión, visión y valores de Data Discovery Solutions.",
};

export default function VisionMisionValoresPage() {
  return (
    <>
      <PageHero
        heading="Visión, Misión y Valores."
        intro="No solo implementamos tecnología, construimos confianza y resultados. Nuestro compromiso es ayudarte a crecer con soluciones inteligentes y accesibles."
      />

      <section className="bg-paper py-24">
        <Container>
          <MissionStatement />
          <CoreValues />
        </Container>
      </section>

      <VisionStatement />

      <CtaBanner
        heading="Impulsa tu eficiencia con soluciones inteligentes en datos, automatización e IA"
        buttonLabel="Empieza tu transformación hoy"
      />
    </>
  );
}
