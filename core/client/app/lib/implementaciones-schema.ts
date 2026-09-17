import { z } from "zod";

export type TemplateParameter = {
  name: string;
  label: string;
  type: "string" | "url" | "cron" | string;
  required: boolean;
  defaultValue?: string | null;
  placeholder?: string | null;
};

export type TemplateCredential = {
  name: string;
  label: string;
  placeholder: string;
};

export type ImplementacionTemplate = {
  id: string;
  name: string;
  description: string;
  parameters: TemplateParameter[];
  credentials: TemplateCredential[];
};

export type Implementacion = {
  id: number;
  templateId: string;
  templateName: string;
  name: string;
  status: "deploying" | "running" | "paused" | "error" | "deleted" | string;
  config: Record<string, string>;
  outputs: Record<string, string> | null;
  errorMessage: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type ImplementacionLog = {
  id: number;
  level: "info" | "warning" | "error" | string;
  message: string;
  timestampUtc: string;
};

export const implementacionNameSchema = z
  .string()
  .trim()
  .min(2, "Ingresa un nombre para el servicio.")
  .max(100, "Máximo 100 caracteres.");

// Config/credential values are validated per-field at the wizard step using
// each template's own required/placeholder metadata (server-driven, not
// known statically) — so this only covers the one field common to every
// template, the display name.
export const deployImplementacionSchema = z.object({
  name: implementacionNameSchema,
});

export type DeployImplementacionValues = z.infer<typeof deployImplementacionSchema>;
