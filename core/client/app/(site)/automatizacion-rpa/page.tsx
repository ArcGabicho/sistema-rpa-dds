import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/sections/service-detail";
import { getServiceBySlug } from "@/lib/services-data";
import { DEFAULT_DESCRIPTION, pageMetadata } from "@/lib/metadata";

const service = getServiceBySlug("automatizacion-rpa");

export const metadata = pageMetadata({
  title: `${service?.title} | Data Discovery Solutions`,
  description: service?.heroSubtitle ?? DEFAULT_DESCRIPTION,
  path: "/automatizacion-rpa",
});

export default function AutomatizacionRpaPage() {
  if (!service) notFound();
  return <ServiceDetail service={service} />;
}
