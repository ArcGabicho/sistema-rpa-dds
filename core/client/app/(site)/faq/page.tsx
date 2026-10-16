import { PageHero } from "@/components/sections/page-hero";
import { FaqGroups } from "@/components/sections/faq-groups";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Preguntas Frecuentes sobre Automatización, Analítica y Transformación Digital | DDS",
  description: "Conoce cómo trabajamos y cómo podemos ayudarte a transformar tu negocio con automatización, analítica e inteligencia artificial.",
  path: "/faq",
});

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
