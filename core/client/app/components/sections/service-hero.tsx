import { FacadeBackdrop } from "@/components/layout/facade-backdrop";
import { ChevronRight, Phone } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/site-config";

export function ServiceHero({
  heading,
  intro,
}: {
  heading: string;
  intro: string;
}) {
  return (
    <section className="relative overflow-hidden pt-14 pb-16 lg:pt-20 lg:pb-24">
      <FacadeBackdrop tone="light" />
      <Container className="relative grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-ink-500">
            <Link href="/" className="hover:text-ink-950">
              Inicio
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink-950">{heading}</span>
          </nav>

          <h1 className="mt-8 max-w-4xl text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
            {heading}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-700">
            {intro}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card-hover">
          <p className="font-display text-base font-semibold text-ink-950">
            Agenda una sesión de exploración
          </p>
          <a
            href={`tel:${SITE.phone.replace(/\s/g, "")}`}
            className="mt-3 flex items-center gap-2 text-sm text-ink-700 hover:text-ink-950"
          >
            <Phone className="h-4 w-4 shrink-0" />
            (+51) {SITE.phoneDisplay.replace(/^\(51\)\s*/, "")}
          </a>
          <Link
            href={SITE.contactUrl}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-900"
          >
            Solicita una demo gratuita
          </Link>
        </div>
      </Container>
    </section>
  );
}
