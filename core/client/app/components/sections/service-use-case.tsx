"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Container } from "@/components/ui/container";

export type ServiceUseCaseItem = {
  icon: ReactNode;
  title: string;
  description: string;
  bullets: string[];
};

export function ServiceUseCase({
  heading,
  intro,
  useCases,
}: {
  heading: string;
  intro: string;
  useCases: ServiceUseCaseItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = useCases[activeIndex];

  return (
    <section className="bg-white py-20">
      <Container className="max-w-3xl">
        <h2 className="text-center font-display text-2xl font-semibold leading-snug text-ink-950 sm:text-3xl">
          {heading}
        </h2>
        <p className="mt-4 text-center leading-relaxed text-ink-700">{intro}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {useCases.map((useCase, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={useCase.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-pressed={isActive}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-brand-700 text-white"
                    : "bg-brand-50 text-ink-700 hover:bg-brand-200"
                }`}
              >
                {useCase.title}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-8 rounded-2xl border border-line p-8 sm:p-10"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
                {active.icon}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-ink-950">
                  {active.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  {active.description}
                </p>
              </div>
            </div>

            <ul className="mt-6 grid gap-2.5 border-t border-line pt-6 sm:grid-cols-2">
              {active.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2.5 text-sm text-ink-700">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                  {bullet}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </Container>
    </section>
  );
}
