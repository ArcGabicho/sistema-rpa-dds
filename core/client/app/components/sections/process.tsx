"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ActionLink } from "@/components/ui/action-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PROCESS_STEPS } from "@/lib/process-steps";
import { SITE } from "@/lib/site-config";

export function Process() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      id="proceso"
      className="scroll-mt-24 bg-[linear-gradient(135deg,var(--color-ink-950)_0%,var(--color-ink-900)_60%,var(--color-brand-700)_140%)] py-24"
    >
      <Container className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <Eyebrow tone="dark">Nuestro proceso</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Guiamos a líderes de negocio y tecnología hacia las mejores
            soluciones en datos, RPA e IA
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            Nuestros expertos combinan automatización, analítica e
            inteligencia artificial para que tu transformación digital sea
            clara, rápida y sin complicaciones.
          </p>
          <ActionLink href={SITE.processUrl} external tone="dark" className="mt-6">
            Conoce nuestro proceso de trabajo
          </ActionLink>
        </div>

        <div className="flex flex-col divide-y divide-white/10 border-t border-b border-white/10">
          {PROCESS_STEPS.map((step, index) => {
            const isOpen = index === openIndex;
            return (
              <div key={step.title}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-5 py-5 text-left"
                >
                  <span className="font-display text-sm font-semibold text-glow-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-display text-base font-semibold text-white">
                    {step.title}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-white/70 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pl-9 text-sm leading-relaxed text-white/70">
                        {step.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
