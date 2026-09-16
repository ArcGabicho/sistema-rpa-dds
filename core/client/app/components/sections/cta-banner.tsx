import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/site-config";

export function CtaBanner({
  heading,
  buttonLabel,
  href = SITE.contactUrl,
}: {
  heading: string;
  buttonLabel: string;
  href?: string;
}) {
  return (
    <section className="bg-ink-950 py-20">
      <Container className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="max-w-xl font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl">
          {heading}
        </h2>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center rounded-full bg-brass-500 px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-brass-600"
        >
          {buttonLabel}
        </Link>
      </Container>
    </section>
  );
}
