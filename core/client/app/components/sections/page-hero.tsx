import { FacadeBackdrop } from "@/components/layout/facade-backdrop";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export function PageHero({
  heading,
  intro,
}: {
  heading: string;
  intro: string;
}) {
  const breadcrumbLabel = heading.replace(/\.$/, "");

  return (
    <section className="relative overflow-hidden pt-14 pb-16 lg:pt-20 lg:pb-24">
      <FacadeBackdrop tone="light" />
      <Container className="relative">
        <nav className="flex items-center gap-1.5 text-xs text-ink-500">
          <Link href="/" className="hover:text-ink-950">
            Inicio
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink-950">{breadcrumbLabel}</span>
        </nav>

        <h1 className="mt-8 max-w-4xl text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink-950 sm:text-5xl lg:text-6xl">
          {heading}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-700">
          {intro}
        </p>
      </Container>
    </section>
  );
}
