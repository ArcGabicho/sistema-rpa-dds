"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Mail, Menu, Phone, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { NAV_LINKS, SITE } from "@/lib/site-config";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null);
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/80 backdrop-blur">
      <div className="hidden border-b border-line bg-ink-950 lg:block">
        <Container className="flex items-center justify-end gap-6 py-2">
          <a
            href={`tel:${SITE.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-1.5 text-xs text-paper-dim transition-colors hover:text-paper"
          >
            <Phone className="h-3.5 w-3.5" />
            {SITE.phoneDisplay}
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="flex items-center gap-1.5 text-xs text-paper-dim transition-colors hover:text-paper"
          >
            <Mail className="h-3.5 w-3.5" />
            {SITE.email}
          </a>
        </Container>
      </div>

      <Container className="flex h-18 items-center justify-between py-3">
        <Link href="/#top" className="flex items-center gap-2.5">
          <Image src="/icon.png" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-display text-[15px] font-bold tracking-tight text-ink-950">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) =>
            link.children ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setOpenDesktopMenu(link.label)}
                onMouseLeave={() =>
                  setOpenDesktopMenu((current) =>
                    current === link.label ? null : current,
                  )
                }
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-1 text-sm text-slate transition-colors hover:text-ink-950"
                >
                  {link.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Link>

                <AnimatePresence>
                  {openDesktopMenu === link.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute top-full left-0 w-64 rounded-xl border border-line bg-paper py-2 shadow-lg"
                    >
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-slate transition-colors hover:bg-mist hover:text-ink-950"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate transition-colors hover:text-ink-950"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden lg:block">
          <Link
            href={SITE.contactUrl}
            className="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brass-500"
          >
            Solicita tu asesoría gratuita
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-950 lg:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-line bg-paper lg:hidden"
          >
            <Container className="flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) =>
                link.children ? (
                  <div key={link.label}>
                    <div className="flex items-center justify-between rounded-lg px-3 py-2.5">
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="text-sm text-slate hover:text-ink-950"
                      >
                        {link.label}
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMobileMenu((current) =>
                            current === link.label ? null : link.label,
                          )
                        }
                        aria-label={`Mostrar submenú de ${link.label}`}
                        aria-expanded={openMobileMenu === link.label}
                        className="p-1 text-slate"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            openMobileMenu === link.label ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                    <AnimatePresence initial={false}>
                      {openMobileMenu === link.label && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-1 py-1 pl-5">
                            {link.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setOpen(false)}
                                className="rounded-lg px-3 py-2 text-sm text-slate hover:bg-mist hover:text-ink-950"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm text-slate hover:bg-mist hover:text-ink-950"
                  >
                    {link.label}
                  </Link>
                ),
              )}
              <Link
                href={SITE.contactUrl}
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-ink-950 px-5 py-3 text-center text-sm font-medium text-paper"
              >
                Solicita tu asesoría gratuita
              </Link>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
