"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { TIMELINE } from "@/lib/timeline";

export function AboutTimeline() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-ink-950 py-24">
      <Container>
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl">
            Nuestra historia
          </h2>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Anterior"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-800 text-paper-dim transition-colors hover:border-signal-400 hover:text-paper"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Siguiente"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-800 text-paper-dim transition-colors hover:border-signal-400 hover:text-paper"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TIMELINE.map((milestone) => (
            <div
              key={milestone.title}
              className="w-72 shrink-0 snap-start border-t border-ink-800 pt-6"
            >
              <p className="text-xs font-medium text-signal-400">
                {milestone.years}
              </p>
              <h3 className="mt-2 font-display text-lg font-bold text-paper">
                {milestone.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                {milestone.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
