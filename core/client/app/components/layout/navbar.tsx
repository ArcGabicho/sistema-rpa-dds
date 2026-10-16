"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { NAV_LINKS, SITE, type NavLink } from "@/lib/site-config";

// azure.com-style header: a thin announcement bar, then a full-width white
// bar. Not sticky — like azure.com, the page's own section nav (on the home
// page) is what sticks.
function isActive(link: NavLink, pathname: string) {
  const paths = [link.href, ...(link.children?.map((child) => child.href) ?? [])].filter(
    (href) => !href.includes("#"),
  );
  return paths.some((href) => (href === "/" ? pathname === "/" : pathname.startsWith(href)));
}

const PRIMARY_BUTTON =
  "inline-flex h-9 items-center rounded-md bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-900";
const SECONDARY_BUTTON =
  "inline-flex h-9 items-center rounded-md border border-ink-950 bg-white px-4 text-sm font-semibold text-ink-950 transition-colors hover:bg-brand-50";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null);
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);

  return (
    <>
      <div className="bg-ink-950">
        <Container className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2 text-center text-xs sm:text-[13px]">
          <span className="text-white/80">
            <span className="sm:hidden">Diagnóstico gratuito de tus procesos.</span>
            <span className="hidden sm:inline">
              ¿Primera vez con DDS? Agenda un diagnóstico gratuito de tus procesos.
            </span>
          </span>
          <Link href={SITE.contactUrl} className="font-semibold text-glow-300 hover:underline">
            Solicítalo aquí
          </Link>
        </Container>
      </div>

      <header className="relative z-40 border-b border-line bg-white">
        <Container className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <Image src="/assets/icon.png" alt="" width={28} height={28} className="h-7 w-7" />
            <span className="font-display text-[15px] font-semibold tracking-tight text-ink-950">
              {SITE.name}
            </span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link, pathname);
              const linkClass = `flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors ${
                active ? "font-semibold text-brand-700" : "text-ink-700 hover:bg-brand-50 hover:text-ink-950"
              }`;
              return link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setOpenDesktopMenu(link.label)}
                  onMouseLeave={() =>
                    setOpenDesktopMenu((current) => (current === link.label ? null : current))
                  }
                >
                  <Link href={link.href} className={linkClass} aria-current={active ? "page" : undefined}>
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
                        className="absolute top-full left-0 pt-1"
                      >
                        <div className="w-64 rounded-lg bg-white p-1.5 shadow-flyout">
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block rounded-md px-3 py-2.5 text-sm text-ink-700 transition-colors hover:bg-brand-50 hover:text-ink-950"
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
                  className={linkClass}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/ingresar" className={SECONDARY_BUTTON}>
              Ingresar
            </Link>
            <Link href={SITE.contactUrl} className={PRIMARY_BUTTON}>
              Solicita tu asesoría gratuita
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-ink-950 transition-colors hover:bg-brand-50 lg:hidden"
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
              className="overflow-hidden border-t border-line bg-white lg:hidden"
            >
              <Container className="flex flex-col gap-1 py-3">
                {NAV_LINKS.map((link) =>
                  link.children ? (
                    <div key={link.label}>
                      <div className="flex items-center justify-between">
                        <Link
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="flex-1 rounded-md px-3 py-2.5 text-sm text-ink-700 hover:bg-brand-50 hover:text-ink-950"
                        >
                          {link.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMobileMenu((current) => (current === link.label ? null : link.label))
                          }
                          aria-label={`Mostrar submenú de ${link.label}`}
                          aria-expanded={openMobileMenu === link.label}
                          className="rounded-md p-2 text-ink-500 hover:bg-brand-50"
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
                            <div className="flex flex-col gap-1 py-1 pl-4">
                              {link.children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setOpen(false)}
                                  className="rounded-md px-3 py-2 text-sm text-ink-500 hover:bg-brand-50 hover:text-ink-950"
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
                      className="rounded-md px-3 py-2.5 text-sm text-ink-700 hover:bg-brand-50 hover:text-ink-950"
                    >
                      {link.label}
                    </Link>
                  ),
                )}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link href="/ingresar" onClick={() => setOpen(false)} className={`${SECONDARY_BUTTON} h-11 justify-center`}>
                    Ingresar
                  </Link>
                  <Link href={SITE.contactUrl} onClick={() => setOpen(false)} className={`${PRIMARY_BUTTON} h-11 justify-center`}>
                    Solicita asesoría
                  </Link>
                </div>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
