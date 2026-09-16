import { Hero } from "@/components/sections/hero";
import { LogoCloud } from "@/components/sections/logo-cloud";
import { ServicesOverview } from "@/components/sections/services-overview";
import { About } from "@/components/sections/about";
import { Industries } from "@/components/sections/industries";
import { Process } from "@/components/sections/process";
import { Benefits } from "@/components/sections/benefits";
import { CaseStudies } from "@/components/sections/case-studies";
import { Faq } from "@/components/sections/faq";
import { CtaBanner } from "@/components/sections/cta-banner";

export default function Home() {
  return (
    <>
      <Hero />
      <LogoCloud />
      <ServicesOverview />
      <About />
      <Industries />
      <Process />
      <Benefits />
      <CaseStudies />
      <Faq />
      <CtaBanner
        heading="Siempre estamos listos para ayudarte. Conversemos y construyamos soluciones juntos."
        buttonLabel="Contáctanos"
      />
    </>
  );
}
