import { ServiceHero } from "@/components/sections/service-hero";
import { ServiceIntro } from "@/components/sections/service-intro";
import { ServiceHighlights } from "@/components/sections/service-highlights";
import { ServicePillars } from "@/components/sections/service-pillars";
import { ServiceUseCase } from "@/components/sections/service-use-case";
import { ServiceProcess } from "@/components/sections/service-process";
import { CtaBanner } from "@/components/sections/cta-banner";
import type { Service } from "@/lib/services-data";

export function ServiceDetail({ service }: { service: Service }) {
  const useCases = service.useCases.map((useCase) => ({
    ...useCase,
    icon: <useCase.icon className="h-5 w-5" strokeWidth={1.75} />,
  }));

  return (
    <>
      <ServiceHero heading={service.title} intro={service.heroSubtitle} />
      <ServiceIntro service={service} />
      <ServiceHighlights service={service} />
      <ServicePillars service={service} />
      <ServiceUseCase
        heading={service.useCasesHeading}
        intro={service.useCasesIntro}
        useCases={useCases}
      />
      <ServiceProcess service={service} />
      <CtaBanner
        heading="¿Conversamos sobre tu proyecto?"
        buttonLabel="Solicita tu asesoría gratuita"
      />
    </>
  );
}
