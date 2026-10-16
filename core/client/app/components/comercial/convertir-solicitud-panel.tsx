"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { EmpresaPicker, type EmpresaOption } from "@/components/comercial/empresa-picker";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { ActionLink } from "@/components/ui/action-link";
import { panelFetch } from "@/lib/panel-api";

// Turns a web contact-form request into a pipeline opportunity: under an
// existing company or a new one, with the requester as its contact and the
// original message on the timeline.
export function ConvertirSolicitudPanel({
  solicitudId,
  oportunidadId,
}: {
  solicitudId: number;
  oportunidadId: number | null;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<"nueva" | "existente">("nueva");
  const [empresaNombre, setEmpresaNombre] = useState("");
  const [empresa, setEmpresa] = useState<EmpresaOption | null>(null);
  const [saving, setSaving] = useState(false);

  if (oportunidadId) {
    return (
      <section className={`${CARD} p-6`}>
        <h2 className="text-base font-semibold text-ink-950">En el embudo</h2>
        <p className="mt-1.5 text-sm text-ink-500">Esta solicitud ya es una oportunidad comercial.</p>
        <ActionLink href={`/dashboard/oportunidades/${oportunidadId}`} className="mt-4">
          Ver la oportunidad
        </ActionLink>
      </section>
    );
  }

  const ready = modo === "nueva" ? empresaNombre.trim().length >= 2 : empresa !== null;

  async function convertir(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setSaving(true);
    const result = await panelFetch<{ oportunidadId: number }>(`clients/${solicitudId}/convertir`, {
      method: "POST",
      body: modo === "nueva" ? { empresaNombre: empresaNombre.trim() } : { empresaId: empresa!.id },
    });
    setSaving(false);

    if (!result.ok) {
      sileo.error({ title: "No se pudo convertir la solicitud", description: result.message });
      return;
    }
    sileo.success({ title: "Oportunidad creada", description: "La solicitud pasó al embudo comercial." });
    router.push(`/dashboard/oportunidades/${result.data.oportunidadId}`);
    router.refresh();
  }

  return (
    <form onSubmit={convertir} className={`${CARD} p-6`}>
      <h2 className="text-base font-semibold text-ink-950">Convertir en oportunidad</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        La persona queda como contacto de la empresa y su mensaje, en el historial.
      </p>

      <div className="mt-4 grid grid-cols-2 rounded-md border border-line p-0.5 text-sm" role="radiogroup" aria-label="Empresa">
        {(
          [
            ["nueva", "Empresa nueva"],
            ["existente", "Ya registrada"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={modo === value}
            onClick={() => setModo(value)}
            className={`h-8 rounded-[5px] font-medium transition-colors ${
              modo === value ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-brand-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {modo === "nueva" ? (
          <Field id="convertir-empresa-nombre" label="Nombre de la empresa">
            <input
              id="convertir-empresa-nombre"
              value={empresaNombre}
              maxLength={300}
              onChange={(e) => setEmpresaNombre(e.target.value)}
              placeholder="Ej. Transportes Rímac"
              className={`${INPUT_BASE} ${inputState(false)}`}
            />
          </Field>
        ) : (
          <Field id="convertir-empresa" label="Empresa">
            <EmpresaPicker id="convertir-empresa" value={empresa} onChange={setEmpresa} />
          </Field>
        )}
      </div>

      <button type="submit" disabled={!ready || saving} className={`${BUTTON_PRIMARY} mt-5 w-full`}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Convertir
      </button>
    </form>
  );
}
