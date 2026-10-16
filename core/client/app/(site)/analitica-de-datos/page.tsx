import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/sections/service-detail";
import { getServiceBySlug } from "@/lib/services-data";
import { DEFAULT_DESCRIPTION, pageMetadata } from "@/lib/metadata";

const service = getServiceBySlug("analitica-de-datos");

export const metadata = pageMetadata({
  title: `${service?.title} | Data Discovery Solutions`,
  description: service?.heroSubtitle ?? DEFAULT_DESCRIPTION,
  path: "/analitica-de-datos",
});

export default function AnaliticaDeDatosPage() {
  if (!service) notFound();
  return <ServiceDetail service={service} />;
}
