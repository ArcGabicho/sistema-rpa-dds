import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SERVICES } from "@/lib/services-data";
import { SITE } from "@/lib/site-config";

const COMPANY_LINKS = [
  { label: "Sobre DDS", href: SITE.aboutUrl },
  { label: "Nuestro Proceso", href: "/#proceso" },
  { label: "Visión, Misión y Valores", href: SITE.visionMisionUrl },
];

export function Footer() {
  return (
    <footer className="bg-ink-950 pt-16 pb-8">
      <Container>
        <div className="flex flex-col gap-8 border-b border-ink-800 pb-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-paper">
              Ideas que transforman con IA, RPA y Analítica
            </h2>
            <p className="mt-2 max-w-md text-sm text-paper-dim">
              Nuestro newsletter mensual en LinkedIn te conecta con casos de
              éxito, estrategias y herramientas que están revolucionando
              empresas en Perú.
            </p>
          </div>
          <a
            href={SITE.linkedinNewsletter}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink-950 transition-colors hover:bg-paper-dim"
          >
            Suscribirte en LinkedIn
          </a>
        </div>

        <div className="grid gap-12 pt-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper">
                <Image src="/assets/icon.png" alt="" width={28} height={28} className="h-7 w-7" />
              </span>
              <span className="font-display text-[15px] font-bold text-paper">
                {SITE.name}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper-dim">
              Sabemos que gestionar un negocio puede ser caótico. Ahí es
              donde entramos nosotros: claridad, eficiencia y control con
              soluciones inteligentes.
            </p>
            <div className="mt-5 flex gap-4">
              <a
                href={SITE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-paper-dim transition-colors hover:text-paper"
              >
                LinkedIn
              </a>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-paper-dim transition-colors hover:text-paper"
              >
                Instagram
              </a>
              <a
                href="/ingresar"
                rel="noopener noreferrer"
                className="text-sm text-paper-dim transition-colors hover:text-paper"
              >
                Panel
              </a>
            </div>
          </div>

          <div>
            <p className="font-display text-sm font-bold text-paper">
              Soluciones para tu empresa
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/${service.slug}`}
                    className="text-sm text-paper-dim transition-colors hover:text-paper"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={SITE.faqUrl}
                  className="text-sm text-paper-dim transition-colors hover:text-paper"
                >
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-display text-sm font-bold text-paper">Empresa</p>
            <ul className="mt-4 flex flex-col gap-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-paper-dim transition-colors hover:text-paper"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-display text-sm font-bold text-paper">
              Datos de contacto
            </p>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-paper-dim">
              <li>{SITE.email}</li>
              <li>WhatsApp: {SITE.phoneDisplay}</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-ink-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-paper-dim">
            Copyright © {new Date().getFullYear()} {SITE.name}. Todos los
            derechos reservados.
          </p>
          <Link
            href={SITE.privacyUrl}
            className="text-xs text-paper-dim transition-colors hover:text-paper"
          >
            Política de Privacidad y Confidencialidad
          </Link>
        </div>
      </Container>
    </footer>
  );
}
