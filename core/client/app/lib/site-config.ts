export const SITE = {
  name: "Data Discovery Solutions",
  shortName: "DDS",
  tagline: "Automatiza. Analiza. Transforma.",
  email: "discovery@dds.pe",
  phone: "+51 956 747 454",
  phoneDisplay: "(51) 956 747 454",
  hours: "Lunes a Viernes: 8:00 a.m. – 6:00 p.m.",
  whatsapp: "https://wa.me/51956747454",
  linkedin: "https://www.linkedin.com/company/data-discovery-solutions",
  instagram: "https://www.instagram.com/datadiscoverysolutions/",
  linkedinNewsletter:
    "https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7042168745930158081",
  privacyUrl: "/politicas-de-privacidad",
  faqUrl: "/faq",
  contactUrl: "/contactenos",
  portfolioUrl: "https://dds.pe/portfolio/",
  aboutUrl: "/sobre-nosotros",
  visionMisionUrl: "/vision-mision-valores",
  processUrl: "https://dds.pe/nuestro-proceso/",
};

export type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const NAV_LINKS: NavLink[] = [
  { label: "Inicio", href: "/" },
  {
    label: "Sobre DDS",
    href: "/sobre-nosotros",
    children: [
      { label: "Visión, Misión y Valores", href: "/vision-mision-valores" },
    ],
  },
  {
    label: "Nuestro Proceso",
    href: "/#proceso",
    children: [
      { label: "Analítica de Datos", href: "/analitica-de-datos" },
      { label: "Automatización RPA", href: "/automatizacion-rpa" },
      { label: "Inteligencia Artificial (IA)", href: "/inteligencia-artificial" },
    ],
  },
  { label: "FAQ", href: "/faq" },
  { label: "Contáctenos", href: "/contactenos" },
];
