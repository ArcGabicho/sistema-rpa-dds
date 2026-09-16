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
            className="text-brass-500 hover:text-brass-600"
          >
            {SITE.email}
          </a>,
        ],
  );
}

export function PrivacyContent() {
  return (
    <section className="bg-mist py-16">
      <Container className="max-w-3xl">
        <div className="rounded-2xl bg-paper p-8 sm:p-12">
          <p className="leading-relaxed text-slate">{linkifyEmail(PRIVACY_INTRO)}</p>

          <div className="mt-8 flex flex-col gap-8">
            {PRIVACY_SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="font-display text-lg font-bold text-ink-950">
                  {section.title}
                </h2>
                <p className="mt-2 leading-relaxed text-slate">
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
