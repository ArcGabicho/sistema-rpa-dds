import { Mail, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/sections/contact-form";
import { SITE } from "@/lib/site-config";

export function ContactPanel() {
  return (
    <section className="bg-mist py-20">
      <Container className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
            ¡Colaboremos!
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate">
            Siempre estamos listos para ayudarte. Conversemos y construyamos
            soluciones juntos.
          </p>

          <div className="mt-10 flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass-500 text-paper">
                <MessageCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-ink-950">
                  Contáctanos
                </p>
                <a
                  href={SITE.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brass-500 hover:text-brass-600"
                >
                  {SITE.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass-500 text-paper">
                <Mail className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-ink-950">
                  Contáctanos
                </p>
                <p className="text-sm text-slate">
                  Correo:{" "}
                  <a
                    href={`mailto:${SITE.email}`}
                    className="text-brass-500 hover:text-brass-600"
                  >
                    {SITE.email}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-paper p-8 sm:p-10">
          <ContactForm />
        </div>
      </Container>
    </section>
  );
}
