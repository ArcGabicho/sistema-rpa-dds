import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/sections/service-detail";
import { getServiceBySlug } from "@/lib/services-data";

const service = getServiceBySlug("automatizacion-rpa");

export const metadata: Metadata = {
  title: `${service?.title} | Data Discovery Solutions`,
  description: service?.heroSubtitle,
};

export default function AutomatizacionRpaPage() {
  if (!service) notFound();
  return <ServiceDetail service={service} />;
}
