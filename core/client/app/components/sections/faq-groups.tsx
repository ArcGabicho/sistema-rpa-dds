"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, ChevronDown, Mail, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FAQ_GROUPS } from "@/lib/faq-data";
import { SITE } from "@/lib/site-config";

export function FaqGroups() {
  const [openKey, setOpenKey] = useState<string | null>("0-0");

  return (
    <section className="bg-white py-20">
      <Container className="grid gap-14 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="flex flex-col gap-16">
          {FAQ_GROUPS.map((group, groupIndex) => (
            <div key={group.heading}>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
                {group.heading}
              </h2>
              <p className="mt-3 text-ink-700">{group.intro}</p>

              <div className="mt-8 flex flex-col divide-y divide-line border-t border-line">
                {group.items.map((item, itemIndex) => {
                  const key = `${groupIndex}-${itemIndex}`;
                  const isOpen = openKey === key;
                  return (
                    <div key={item.question}>
                      <button
                        type="button"
                        onClick={() => setOpenKey(isOpen ? null : key)}
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
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-28">
          <div className="rounded-2xl bg-ink-950 p-8">
            <h3 className="font-display text-xl font-semibold text-white">
              ¿Aún tienes dudas?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Escríbenos por WhatsApp o correo. Podemos agendar una demo o
              revisar tu caso sin compromiso.
            </p>

            <div className="mt-6 flex flex-col gap-5 border-t border-white/10 pt-6">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-glow-300" />
                <div>
                  <p className="text-xs text-white/70">WhatsApp</p>
                  <a
                    href={SITE.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white hover:underline"
                  >
                    {SITE.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-glow-300" />
                <div>
                  <p className="text-xs text-white/70">Email</p>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="text-sm text-white hover:underline"
                  >
                    {SITE.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-glow-300" />
                <div>
                  <p className="text-xs text-white/70">Horario de Atención</p>
                  <p className="text-sm text-white">{SITE.hours}</p>
                </div>
              </div>
            </div>

            <Link
              href={SITE.contactUrl}
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-ink-950 transition-colors hover:bg-white/85"
            >
              Contáctanos ahora
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
