import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { AboutWelcome } from "@/components/sections/about-welcome";
import { AboutTimeline } from "@/components/sections/about-timeline";
import { AboutValues } from "@/components/sections/about-values";
import { AboutWhyChoose } from "@/components/sections/about-why-choose";
import { AboutClients } from "@/components/sections/about-clients";
import { CtaBanner } from "@/components/sections/cta-banner";

export const metadata: Metadata = {
  title: "Sobre Data Discovery Solutions | DDS",
  description:
    "Descubre cómo nuestras soluciones en datos, automatización e inteligencia artificial pueden transformar tu negocio desde adentro.",
};

export default function SobreNosotrosPage() {
  return (
    <>
      <PageHero
        heading="Sobre Data Discovery Solutions"
        intro="Descubre cómo nuestras soluciones en datos, automatización e inteligencia artificial pueden transformar tu negocio desde adentro."
      />
      <AboutWelcome />
      <AboutTimeline />
      <AboutValues />
      <AboutWhyChoose />
      <AboutClients />
      <CtaBanner
        heading="Soluciones inteligentes para empresas modernas"
        buttonLabel="Hablemos de tu proyecto"
      />
    </>
  );
}
