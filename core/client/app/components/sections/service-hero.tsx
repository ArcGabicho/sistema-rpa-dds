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
    <section className="bg-ink-950 py-16 lg:py-20">
      <Container className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-paper-dim">
            <Link href="/" className="hover:text-paper">
              Inicio
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-paper">{heading}</span>
          </nav>

          <h1 className="mt-6 max-w-2xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-paper sm:text-5xl">
            {heading}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper-dim">
            {intro}
          </p>
        </div>

        <div className="rounded-2xl bg-brass-500 p-6">
          <p className="font-display text-base font-bold text-paper">
            Agenda una sesión de exploración
          </p>
          <a
            href={`tel:${SITE.phone.replace(/\s/g, "")}`}
            className="mt-3 flex items-center gap-2 text-sm text-paper/90 hover:text-paper"
          >
            <Phone className="h-4 w-4 shrink-0" />
            (+51) {SITE.phoneDisplay.replace(/^\(51\)\s*/, "")}
          </a>
          <Link
            href={SITE.contactUrl}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-paper-dim"
          >
            Solicita una demo gratuita
          </Link>
        </div>
      </Container>
    </section>
  );
}
