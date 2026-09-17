"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import type { ImplementacionTemplate } from "@/lib/implementaciones-schema";

export type WizardStep = "template" | "config" | "review" | "deploying";

export function useImplementacionDeploy(templates: ImplementacionTemplate[]) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isDeploying, setIsDeploying] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  function selectTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplateId(templateId);
    setConfig(Object.fromEntries((template?.parameters ?? []).map((p) => [p.name, p.defaultValue ?? ""])));
    setCredentials(Object.fromEntries((template?.credentials ?? []).map((c) => [c.name, ""])));
    setStep("config");
  }

  function goToReview() {
    if (!name.trim()) {
      sileo.error({ title: "Falta el nombre", description: "Ingresa un nombre para el servicio." });
      return;
    }
    if (!selectedTemplate) return;

    for (const param of selectedTemplate.parameters) {
      if (param.required && !config[param.name]?.trim()) {
        sileo.error({ title: "Falta un parámetro", description: `Completa "${param.label}".` });
        return;
      }
    }
    for (const cred of selectedTemplate.credentials) {
      if (!credentials[cred.name]?.trim()) {
        sileo.error({ title: "Falta una credencial", description: `Completa "${cred.label}".` });
        return;
      }
    }
    setStep("review");
  }

  async function deploy() {
    if (!selectedTemplate) return;
    setIsDeploying(true);
    setStep("deploying");

    try {
      const response = await fetch("/api/implementaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          name: name.trim(),
          config,
          credentials,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        sileo.error({ title: "No se pudo desplegar", description: data?.message ?? "Intenta de nuevo." });
        setStep("review");
        return;
      }

      sileo.success({ title: "Implementación creada", description: "Desplegando en Azure..." });
      router.push(`/dashboard/implementaciones/${data.id}`);
    } catch {
      sileo.error({ title: "No se pudo desplegar", description: "Ocurrió un error de conexión." });
      setStep("review");
    } finally {
      setIsDeploying(false);
    }
  }

  return {
    step,
    setStep,
    selectedTemplate,
    selectTemplate,
    name,
    setName,
    config,
    setConfig,
    credentials,
    setCredentials,
    goToReview,
    deploy,
    isDeploying,
  };
}
