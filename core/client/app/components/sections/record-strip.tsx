"use client";

import { ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const MESSY_ROWS = [
  { label: "fecha", value: "12/03/25" },
  { label: "ruc", value: "20458821xxx" },
  { label: "monto", value: "S/ 1204.5" },
  { label: "estado", value: "—" },
];

const CLEAN_ROWS = [
  { label: "fecha", value: "2025-03-12" },
  { label: "ruc", value: "20458821945" },
  { label: "monto", value: "S/ 1,204.50" },
  { label: "estado", value: "Validado" },
];

// One record before and after going through a DDS automation.
export function RecordStrip() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid grid-cols-1 items-stretch overflow-hidden rounded-lg bg-white shadow-card sm:grid-cols-[1fr_auto_1fr]"
    >
      <div className="bg-brand-50 px-6 py-6 sm:px-7">
        <p className="text-xs text-ink-500">Como llega hoy</p>
        <dl className="mt-3 flex flex-col gap-2">
          {MESSY_ROWS.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] uppercase text-ink-400">{row.label}</dt>
              <dd className="font-mono text-sm text-ink-700">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div
        className="flex items-center justify-center border-y border-line bg-white px-4 py-3 sm:border-x sm:border-y-0"
        aria-hidden="true"
      >
        <ArrowRight className="h-4 w-4 rotate-90 text-brand-500 sm:rotate-0" />
      </div>

      <div className="bg-ink-950 px-6 py-6 sm:px-7">
        <p className="text-xs text-glow-300">Como queda validado</p>
        <dl className="mt-3 flex flex-col gap-2">
          {CLEAN_ROWS.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] uppercase text-white/50">{row.label}</dt>
              <dd className="flex items-center gap-1.5 font-mono text-sm text-white">
                {row.value}
                {row.label === "estado" && (
                  <Check className="h-3.5 w-3.5 text-glow-300" strokeWidth={2.5} />
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </motion.div>
  );
}
