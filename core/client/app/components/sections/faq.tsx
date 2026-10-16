"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ActionLink } from "@/components/ui/action-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { FAQ_ITEMS } from "@/lib/faq-data";
import { SITE } from "@/lib/site-config";

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 bg-white py-24">
      <Container className="max-w-3xl">
        <Eyebrow>Ayuda</Eyebrow>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
          Preguntas frecuentes
        </h2>

        <div className="mt-10 flex flex-col divide-y divide-line border-t border-line">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="font-display text-base font-semibold text-ink-950">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-ink-700 transition-transform ${
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
                      <p className="pb-6 text-sm leading-relaxed text-ink-700">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <ActionLink href={SITE.faqUrl} className="mt-8">
          Ver todas las preguntas
        </ActionLink>
      </Container>
    </section>
  );
}
