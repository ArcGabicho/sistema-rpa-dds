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
    <section className="bg-ink-950 py-16 lg:py-20">
      <Container>
        <nav className="flex items-center gap-1.5 text-xs text-paper-dim">
          <Link href="/" className="hover:text-paper">
            Inicio
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-paper">{breadcrumbLabel}</span>
        </nav>

        <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-paper sm:text-5xl">
          {heading}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper-dim">
          {intro}
        </p>
      </Container>
    </section>
  );
}
