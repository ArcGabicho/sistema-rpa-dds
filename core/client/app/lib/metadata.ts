import type { Metadata } from "next";
import { SITE } from "@/lib/site-config";

export const DEFAULT_TITLE = "Data Discovery Solutions | Analítica, RPA e IA";
export const DEFAULT_DESCRIPTION =
  "Soluciones inteligentes en Analítica de Datos, Automatización RPA e Inteligencia Artificial para transformar tu empresa.";

// public/og-image.png: the home hero rendered as a 1200x630 card.
const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Data Discovery Solutions: soluciones inteligentes en Analítica, RPA e IA",
};

// Base for the absolute URLs Open Graph needs. SITE_URL (the public domain)
// wins; on Vercel without it, the project's production domain; otherwise
// the local server.
export function getSiteUrl() {
  if (process.env.SITE_URL) return new URL(process.env.SITE_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}

// Open Graph and Twitter card tags. Next shallow-merges metadata between
// segments, so a page that sets openGraph or twitter replaces the layout's
// whole object: every page gets the full set from here.
export function socialMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      locale: "es_PE",
      siteName: SITE.name,
      title,
      description,
      images: [OG_IMAGE],
      ...(path ? { url: path } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

// A public page's metadata: title, description, canonical URL and its
// social card.
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    ...socialMetadata({ title, description, path }),
  };
}
