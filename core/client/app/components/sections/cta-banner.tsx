import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SITE } from "@/lib/site-config";

// Closing call to action: azure.com's centered dark band, on the same
// navy-to-blue gradient as the process band.
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
    <section className="bg-[linear-gradient(135deg,var(--color-ink-950)_0%,var(--color-ink-900)_60%,var(--color-brand-700)_140%)] py-20 sm:py-24">
      <Container className="text-center">
        <h2 className="mx-auto max-w-3xl text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
          {heading}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/75">
          O escríbenos a{" "}
          <a href={`mailto:${SITE.email}`} className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
            {SITE.email}
          </a>
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={href}
            className="inline-flex h-11 items-center rounded-md bg-white px-6 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            {buttonLabel}
          </Link>
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded-md border border-white px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Escríbenos por WhatsApp
          </a>
        </div>
      </Container>
    </section>
  );
}
