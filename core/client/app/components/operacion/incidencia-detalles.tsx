"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import type { TeamUser } from "@/lib/comercial";
import { CANALES, CAUSAS, SEVERIDADES, type Incidencia } from "@/lib/operacion";
import { panelFetch } from "@/lib/panel-api";

// The incident's details, editable. Changing the severity recalculates the
// SLA from the report time; the change goes on the history.
export function IncidenciaDetalles({
  incidencia,
  bots,
  users,
}: {
  incidencia: Incidencia;
  bots: { id: number; nombre: string }[];
  users: TeamUser[];
}) {
  const router = useRouter();
  const inicial = {
    titulo: incidencia.titulo,
    descripcion: incidencia.descripcion ?? "",
    severidad: incidencia.severidad,
    causa: incidencia.causa ?? "",
    canal: incidencia.canal,
    reportadoPor: incidencia.reportadoPor ?? "",
    responsableId: incidencia.responsableId?.toString() ?? "",
    botId: incidencia.botId?.toString() ?? "",
  };
  const [form, setForm] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const cambiado = (Object.keys(inicial) as (keyof typeof inicial)[]).some((k) => form[k] !== inicial[k]);
  const set = (campo: keyof typeof inicial) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));
  const input = `${INPUT_BASE} ${inputState(false)}`;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (form.titulo.trim().length < 5) {
      sileo.error({ title: "Falta el título", description: "Resume la incidencia en al menos 5 caracteres." });
      return;
    }
    setGuardando(true);
    const result = await panelFetch(`incidencias/${incidencia.id}`, {
      method: "PUT",
      body: {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        severidad: form.severidad,
        causa: form.causa || null,
        canal: form.canal,
        reportadoPor: form.reportadoPor.trim() || null,
        responsableId: form.responsableId ? Number(form.responsableId) : null,
        botId: form.botId ? Number(form.botId) : null,
      },
    });
    setGuardando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar", description: result.message });
      return;
    }
    sileo.success({ title: "Incidencia actualizada" });
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className={`${CARD} flex flex-col gap-4 p-5`}>
      <h2 className="text-base font-semibold text-ink-950">Detalles</h2>
      <Field id="det-titulo" label="Título">
        <input id="det-titulo" value={form.titulo} maxLength={200} onChange={set("titulo")} className={input} />
      </Field>
      <Field id="det-descripcion" label="Detalle" optional>
        <textarea id="det-descripcion" rows={4} maxLength={4000} value={form.descripcion} onChange={set("descripcion")} className={`${input} h-auto resize-y py-2.5`} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="det-severidad" label="Severidad">
          <select id="det-severidad" value={form.severidad} onChange={set("severidad")} className={input}>
            {SEVERIDADES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="det-canal" label="Canal">
          <select id="det-canal" value={form.canal} onChange={set("canal")} className={input}>
            {CANALES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="det-causa" label="Causa" optional hint="Se pide al resolverla.">
        <select id="det-causa" value={form.causa} onChange={set("causa")} className={input}>
          <option value="">Sin definir</option>
          {CAUSAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field id="det-bot" label="Bot">
        <select id="det-bot" value={form.botId} onChange={set("botId")} className={input}>
          <option value="">Sin bot</option>
          {bots.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </select>
      </Field>
      <Field id="det-responsable" label="Responsable">
        <select id="det-responsable" value={form.responsableId} onChange={set("responsableId")} className={input}>
          <option value="">Sin asignar</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>
      </Field>
      <Field id="det-reporta" label="Reportada por" optional>
        <input id="det-reporta" value={form.reportadoPor} maxLength={200} onChange={set("reportadoPor")} className={input} />
      </Field>
      <button type="submit" disabled={guardando || !cambiado} className={BUTTON_PRIMARY}>
        {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
        {cambiado ? "Guardar cambios" : "Sin cambios"}
      </button>
    </form>
  );
}
