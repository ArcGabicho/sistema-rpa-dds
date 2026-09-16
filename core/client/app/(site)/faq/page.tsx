import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { FaqGroups } from "@/components/sections/faq-groups";

export const metadata: Metadata = {
  title:
    "Preguntas Frecuentes sobre Automatización, Analítica y Transformación Digital | DDS",
  description:
    "Conoce cómo trabajamos y cómo podemos ayudarte a transformar tu negocio con automatización, analítica e inteligencia artificial.",
};

export default function FaqPage() {
  return (
    <>
      <PageHero
        heading="Preguntas Frecuentes sobre Automatización, Analítica y Transformación Digital"
        intro="Conoce cómo trabajamos y cómo podemos ayudarte a transformar tu negocio."
      />
      <FaqGroups />
    </>
  );
}
