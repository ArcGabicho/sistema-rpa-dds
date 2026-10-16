import Link from "next/link";
import { Container } from "@/components/ui/container";
import { FacadeBackdrop } from "@/components/layout/facade-backdrop";
import { SITE } from "@/lib/site-config";

// Closing call to action: the /ingresar composition — a floating white card
// on the dark glass facade.
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
    <section className="relative overflow-hidden bg-ink-950 py-20 sm:py-24">
      <FacadeBackdrop />
      <Container className="relative">
        <div className="flex flex-col items-start gap-8 rounded-[20px] bg-white p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between lg:p-14">
          <div className="max-w-2xl">
            <h2 className="text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-ink-950 sm:text-4xl">
              {heading}
            </h2>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-500">
              <span>
                O escríbenos a{" "}
                <a href={`mailto:${SITE.email}`} className="text-ink-950 hover:underline">
                  {SITE.email}
                </a>
              </span>
              <span>
                WhatsApp{" "}
                <a
                  href={SITE.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-950 hover:underline"
                >
                  {SITE.phoneDisplay}
                </a>
              </span>
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex h-12 shrink-0 items-center rounded-full bg-brand-700 px-7 text-sm font-medium text-white transition-colors hover:bg-ink-900"
          >
            {buttonLabel}
          </Link>
        </div>
      </Container>
    </section>
  );
}
