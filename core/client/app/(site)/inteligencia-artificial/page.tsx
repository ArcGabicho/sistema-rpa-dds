import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/sections/service-detail";
import { getServiceBySlug } from "@/lib/services-data";

const service = getServiceBySlug("inteligencia-artificial");

export const metadata: Metadata = {
  title: `${service?.title} | Data Discovery Solutions`,
  description: service?.heroSubtitle,
};

export default function InteligenciaArtificialPage() {
  if (!service) notFound();
  return <ServiceDetail service={service} />;
}
