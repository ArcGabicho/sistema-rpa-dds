"use client";

import { ArrowLeft, ArrowRight, Bot, Database, FileText, Loader2, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ImplementacionTemplate } from "@/lib/implementaciones-schema";
import { useImplementacionDeploy } from "@/hooks/use-implementacion-deploy";

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  "rpa-web-scraping": Bot,
  "ai-document-processor": FileText,
  "data-sync-etl": Database,
};

const FIELD_BASE =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink-950 outline-none transition-colors placeholder:text-slate/60 focus:border-brass-400";

const STEP_LABELS: Record<string, string> = {
  template: "1. Plantilla",
  config: "2. Configuración",
  review: "3. Revisión",
  deploying: "4. Desplegando",
};

export function ImplementacionWizard({ templates }: { templates: ImplementacionTemplate[] }) {
  const {
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
  } = useImplementacionDeploy(templates);

  return (
    <div>
      <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate">
        {Object.entries(STEP_LABELS).map(([key, label]) => (
          <li
            key={key}
            className={key === step ? "font-medium text-ink-950" : undefined}
          >
            {label}
          </li>
        ))}
      </ol>

      {step === "template" && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const Icon = TEMPLATE_ICONS[template.id] ?? Rocket;
            return (
              <div
                key={template.id}
                className="flex flex-col rounded-2xl border border-line bg-paper p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brass-500/10 text-brass-500">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <p className="mt-4 font-display text-base font-bold text-ink-950">{template.name}</p>
                <p className="mt-1.5 flex-1 text-sm text-slate">{template.description}</p>
                <button
                  type="button"
                  onClick={() => selectTemplate(template.id)}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-brass-500 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brass-600"
                >
                  Seleccionar
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {step === "config" && selectedTemplate && (
        <div className="max-w-xl rounded-2xl border border-line bg-paper p-8">
          <p className="font-display text-base font-bold text-ink-950">{selectedTemplate.name}</p>
          <div className="mt-6 flex flex-col gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-950">Nombre del servicio</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi servicio de scraping"
                className={FIELD_BASE}
              />
            </div>

            {selectedTemplate.parameters.map((param) => (
              <div key={param.name}>
                <label className="mb-1.5 block text-sm font-medium text-ink-950">
                  {param.label}
                  {param.required && <span className="text-brass-500"> *</span>}
                </label>
                <input
                  type={param.type === "url" ? "url" : "text"}
                  value={config[param.name] ?? ""}
                  onChange={(e) => setConfig({ ...config, [param.name]: e.target.value })}
                  placeholder={param.placeholder ?? undefined}
                  className={FIELD_BASE}
                />
              </div>
            ))}

            {selectedTemplate.credentials.map((cred) => (
              <div key={cred.name}>
                <label className="mb-1.5 block text-sm font-medium text-ink-950">
                  {cred.label} <span className="text-brass-500">*</span>
                </label>
                <input
                  type="password"
                  value={credentials[cred.name] ?? ""}
                  onChange={(e) => setCredentials({ ...credentials, [cred.name]: e.target.value })}
                  placeholder={cred.placeholder}
                  className={FIELD_BASE}
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-slate">
                  Se guarda cifrada en Azure Key Vault, nunca en nuestra base de datos.
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("template")}
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-mist"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </button>
            <button
              type="button"
              onClick={goToReview}
              className="inline-flex items-center gap-2 rounded-full bg-brass-500 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brass-600"
            >
              Revisar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === "review" && selectedTemplate && (
        <div className="max-w-xl rounded-2xl border border-line bg-paper p-8">
          <p className="font-display text-base font-bold text-ink-950">Revisa tu implementación</p>

          <dl className="mt-6 flex flex-col divide-y divide-line text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-slate">Plantilla</dt>
              <dd className="font-medium text-ink-950">{selectedTemplate.name}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-slate">Nombre</dt>
              <dd className="font-medium text-ink-950">{name}</dd>
            </div>
            {selectedTemplate.parameters.map((param) => (
              <div key={param.name} className="flex justify-between gap-4 py-3">
                <dt className="text-slate">{param.label}</dt>
                <dd className="truncate font-medium text-ink-950">{config[param.name] || "—"}</dd>
              </div>
            ))}
            {selectedTemplate.credentials.map((cred) => (
              <div key={cred.name} className="flex justify-between py-3">
                <dt className="text-slate">{cred.label}</dt>
                <dd className="font-medium text-ink-950">••••••••</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("config")}
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-mist"
            >
              <ArrowLeft className="h-4 w-4" />
              Editar
            </button>
            <button
              type="button"
              onClick={deploy}
              disabled={isDeploying}
              className="inline-flex items-center gap-2 rounded-full bg-brass-500 px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brass-600 disabled:opacity-60"
            >
              Desplegar
              <Rocket className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === "deploying" && (
        <div className="flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-line bg-paper p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brass-500" />
          <p className="font-display text-base font-bold text-ink-950">Iniciando el deployment...</p>
          <p className="text-sm text-slate">
            Te llevaremos a los detalles del servicio en un momento.
          </p>
        </div>
      )}
    </div>
  );
}
