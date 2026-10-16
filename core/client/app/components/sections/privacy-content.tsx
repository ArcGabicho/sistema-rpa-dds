import { Container } from "@/components/ui/container";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/lib/privacy-data";
import { SITE } from "@/lib/site-config";

function linkifyEmail(text: string) {
  const parts = text.split(SITE.email);
  return parts.flatMap((part, index) =>
    index === parts.length - 1
      ? [part]
      : [
          part,
          <a
            key={index}
            href={`mailto:${SITE.email}`}
            className="text-ink-950 hover:text-ink-700"
          >
            {SITE.email}
          </a>,
        ],
  );
}

export function PrivacyContent() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className="leading-relaxed text-ink-700">{linkifyEmail(PRIVACY_INTRO)}</p>

          <div className="mt-8 flex flex-col gap-8">
            {PRIVACY_SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="font-display text-lg font-semibold text-ink-950">
                  {section.title}
                </h2>
                <p className="mt-2 leading-relaxed text-ink-700">
                  {linkifyEmail(section.body)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
