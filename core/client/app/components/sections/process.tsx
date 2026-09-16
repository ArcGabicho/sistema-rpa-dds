"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PROCESS_STEPS } from "@/lib/process-steps";
import { SITE } from "@/lib/site-config";

export function Process() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="proceso" className="scroll-mt-20 bg-ink-950 py-24 lg:scroll-mt-28">
      <Container className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-paper sm:text-4xl">
            Guiamos a líderes de negocio y tecnología hacia las mejores
            soluciones en datos, RPA e IA
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-paper-dim">
            Nuestros expertos combinan automatización, analítica e
            inteligencia artificial para que tu transformación digital sea
            clara, rápida y sin complicaciones.
          </p>
          <a
            href={SITE.processUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center text-sm font-medium text-signal-400 underline decoration-signal-500/40 underline-offset-4 hover:decoration-signal-400"
          >
            Conoce nuestro proceso de trabajo
          </a>
        </div>

        <div className="flex flex-col divide-y divide-ink-800 border-t border-b border-ink-800">
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
                  <span className="font-display text-sm font-bold text-signal-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-display text-base font-semibold text-paper">
                    {step.title}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-paper-dim transition-transform ${
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
                      <p className="pb-6 pl-9 text-sm leading-relaxed text-paper-dim">
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
