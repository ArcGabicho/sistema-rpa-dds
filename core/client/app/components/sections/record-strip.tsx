"use client";

import { Check } from "lucide-react";
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

export function RecordStrip() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid grid-cols-1 items-stretch gap-0 overflow-hidden rounded-2xl border border-line sm:grid-cols-[1fr_auto_1fr]"
    >
      <div className="bg-mist px-6 py-6 sm:px-7">
        <p className="text-xs text-slate">Como llega hoy</p>
        <dl className="mt-3 flex flex-col gap-2">
          {MESSY_ROWS.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] uppercase text-slate/70">{row.label}</dt>
              <dd className="font-mono text-sm text-ink-800">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex items-center justify-center border-y border-line bg-paper px-4 py-4 sm:border-x sm:border-y-0">
        <span className="h-px w-8 bg-line sm:h-8 sm:w-px" />
      </div>

      <div className="bg-ink-950 px-6 py-6 sm:px-7">
        <p className="text-xs text-signal-400">Como queda validado</p>
        <dl className="mt-3 flex flex-col gap-2">
          {CLEAN_ROWS.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] uppercase text-paper-dim/70">{row.label}</dt>
              <dd className="flex items-center gap-1.5 font-mono text-sm text-paper">
                {row.value}
                {row.label === "estado" && (
                  <Check className="h-3.5 w-3.5 text-signal-400" strokeWidth={2.5} />
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </motion.div>
  );
}
