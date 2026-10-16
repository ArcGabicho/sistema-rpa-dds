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

const LINK = "text-sm text-ink-700 hover:text-ink-950 hover:underline";

// Light azure.com-style footer: link columns on a pale tint, legal row below.
export function Footer() {
  return (
    <footer className="border-t border-line bg-brand-50 pt-14 pb-8">
      <Container>
        <div className="flex flex-col gap-6 rounded-lg bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-950">
              Ideas que transforman con IA, RPA y Analítica
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-700">
              Nuestro newsletter mensual en LinkedIn te conecta con casos de
              éxito, estrategias y herramientas que están revolucionando
              empresas en Perú.
            </p>
          </div>
          <a
            href={SITE.linkedinNewsletter}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-brand-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-900"
          >
            Suscribirte en LinkedIn
          </a>
        </div>

        <div className="grid gap-10 pt-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Image src="/assets/icon.png" alt="" width={28} height={28} className="h-7 w-7" />
              <span className="font-display text-[15px] font-semibold text-ink-950">{SITE.name}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-700">
              Sabemos que gestionar un negocio puede ser caótico. Ahí es
              donde entramos nosotros: claridad, eficiencia y control con
              soluciones inteligentes.
            </p>
            <div className="mt-5 flex gap-4">
              <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className={LINK}>
                LinkedIn
              </a>
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className={LINK}>
                Instagram
              </a>
              <Link href="/ingresar" className={LINK}>
                Panel
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink-950">Soluciones para tu empresa</p>
            <ul className="mt-4 flex flex-col gap-3">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link href={`/${service.slug}`} className={LINK}>
                    {service.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={SITE.faqUrl} className={LINK}>
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink-950">Empresa</p>
            <ul className="mt-4 flex flex-col gap-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink-950">Datos de contacto</p>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-ink-700">
              <li>
                <a href={`mailto:${SITE.email}`} className={LINK}>
                  {SITE.email}
                </a>
              </li>
              <li>
                <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" className={LINK}>
                  WhatsApp: {SITE.phoneDisplay}
                </a>
              </li>
              <li>{SITE.hours}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-500">
            Copyright © {new Date().getFullYear()} {SITE.name}. Todos los
            derechos reservados.
          </p>
          <Link href={SITE.privacyUrl} className="text-xs text-ink-500 hover:text-ink-950 hover:underline">
            Política de Privacidad y Confidencialidad
          </Link>
        </div>
      </Container>
    </footer>
  );
}
