"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV_LINKS, SITE, type NavLink } from "@/lib/site-config";

// A floating white pill over the page, with the active page marked as a
// pill too — the same shape as the dashboard's sidebar items and every
// button in the project. Fixed, so page heroes leave room for it at the top.
function isActive(link: NavLink, pathname: string) {
  const paths = [link.href, ...(link.children?.map((child) => child.href) ?? [])].filter(
    (href) => !href.includes("#"),
  );
  return paths.some((href) => (href === "/" ? pathname === "/" : pathname.startsWith(href)));
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null);
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full border border-line/80 bg-white/90 pr-2 pl-3 shadow-[0_8px_30px_-12px_rgb(23_39_58/0.3)] backdrop-blur sm:pl-4">
        <Link href="/#top" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image src="/assets/icon.png" alt="" width={28} height={28} className="h-7 w-7" />
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink-950">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link, pathname);
            const linkClass = `flex items-center gap-1 rounded-full px-3.5 py-2 text-sm transition-colors ${
              active ? "bg-brand-100 font-medium text-ink-950" : "text-ink-700 hover:bg-brand-50 hover:text-ink-950"
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
                      className="absolute top-full left-0 pt-2"
                    >
                      <div className="w-64 rounded-[20px] border border-line bg-white p-1.5 shadow-lg">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block rounded-full px-4 py-2.5 text-sm text-ink-700 transition-colors hover:bg-brand-50 hover:text-ink-950"
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

        <Link
          href={SITE.contactUrl}
          className="hidden h-10 items-center rounded-full bg-brand-700 px-5 text-sm font-medium text-white transition-colors hover:bg-ink-900 lg:inline-flex"
        >
          Solicita tu asesoría gratuita
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-950 transition-colors hover:bg-brand-50 lg:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="mx-auto mt-2 max-w-7xl rounded-[20px] border border-line bg-white p-2 shadow-lg lg:hidden"
          >
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) =>
                link.children ? (
                  <div key={link.label}>
                    <div className="flex items-center justify-between rounded-full pr-2">
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex-1 rounded-full px-4 py-2.5 text-sm text-ink-700 hover:bg-brand-50 hover:text-ink-950"
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
                        className="rounded-full p-2 text-ink-500 hover:bg-brand-50"
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
                                className="rounded-full px-4 py-2 text-sm text-ink-500 hover:bg-brand-50 hover:text-ink-950"
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
                    className="rounded-full px-4 py-2.5 text-sm text-ink-700 hover:bg-brand-50 hover:text-ink-950"
                  >
                    {link.label}
                  </Link>
                ),
              )}
              <Link
                href={SITE.contactUrl}
                onClick={() => setOpen(false)}
                className="mt-1 rounded-full bg-brand-700 px-5 py-3 text-center text-sm font-medium text-white"
              >
                Solicita tu asesoría gratuita
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
