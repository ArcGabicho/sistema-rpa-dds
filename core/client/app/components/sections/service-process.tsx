import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import type { Service } from "@/lib/services-data";

export function ServiceProcess({ service }: { service: Service }) {
  return (
    <section className="bg-ink-950 py-20">
      <Container>
        <p className="text-center text-xs font-medium text-glow-300">
          {service.stepsHeading}
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-4 lg:gap-0">
          {service.steps.map((step, index) => (
            <div key={step.title} className="flex items-start gap-3 lg:items-stretch">
              <div className="flex-1 border-l-2 border-white/10 pl-5 lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-6">
                <p className="text-xs font-medium text-glow-300">
                  Paso {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-base font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {step.description}
                </p>
              </div>

              {index < service.steps.length - 1 && (
                <ChevronRight className="hidden h-5 w-5 shrink-0 text-white/20 lg:mx-4 lg:mt-6 lg:block" />
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
