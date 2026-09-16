import type { Metadata } from "next";
import { PrivacyHero } from "@/components/sections/privacy-hero";
import { PrivacyContent } from "@/components/sections/privacy-content";

export const metadata: Metadata = {
  title: "Políticas de Privacidad | Data Discovery Solutions",
  description:
    "Política de privacidad de Data Discovery Solutions S.A.C., alineada con la Ley N.° 29733 de Protección de Datos Personales del Perú.",
};

export default function PoliticasDePrivacidadPage() {
  return (
    <>
      <PrivacyHero />
      <PrivacyContent />
    </>
  );
}
