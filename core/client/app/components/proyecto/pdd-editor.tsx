"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { sileo } from "sileo";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { SERVICIOS } from "@/lib/comercial";
import { ETAPAS_DESARROLLO, PDD_ESTADOS, PDD_SECCIONES, type PddKey, type ProcesoProyecto } from "@/lib/proyecto";
import { panelFetch } from "@/lib/panel-api";

const texto = (max: number) => z.string().max(max, `Máximo ${max} caracteres.`);

const schema = z
  .object({
    nombre: z.string().trim().min(3, "Nombra el proceso.").max(200),
    area: texto(120),
    servicio: z.enum(["rpa", "ia", "analitica"]),
    etapa: z.enum(["levantamiento", "desarrollo", "pruebas", "produccion"]),
    notasLevantamiento: texto(8000),
    pddEstado: z.enum(["borrador", "en_revision", "aprobado"]),
    pddAprobadoPor: texto(200),
    pddConIa: z.boolean(),
    ...(Object.fromEntries(PDD_SECCIONES.map((s) => [s.key, texto(6000)])) as Record<PddKey, z.ZodString>),
  })
  .refine((v) => v.pddEstado !== "aprobado" || v.pddAprobadoPor.trim() !== "", {
    path: ["pddAprobadoPor"],
    message: "Indica quién del cliente lo aprobó.",
  });

type Values = z.infer<typeof schema>;

function toValues(p: ProcesoProyecto): Values {
  return {
    nombre: p.nombre,
    area: p.area ?? "",
    servicio: p.servicio as Values["servicio"],
    etapa: p.etapa as Values["etapa"],
    notasLevantamiento: p.notasLevantamiento ?? "",
    pddEstado: p.pddEstado as Values["pddEstado"],
    pddAprobadoPor: p.pddAprobadoPor ?? "",
    pddConIa: p.pddConIa,
    ...(Object.fromEntries(PDD_SECCIONES.map((s) => [s.key, p[s.key] ?? ""])) as Record<PddKey, string>),
  };
}

function toBody(v: Values) {
  const vacio = (x: string) => (x.trim() === "" ? null : x.trim());
  return {
    nombre: v.nombre.trim(),
    area: vacio(v.area),
    servicio: v.servicio,
    etapa: v.etapa,
    notasLevantamiento: vacio(v.notasLevantamiento),
    pddEstado: v.pddEstado,
    pddAprobadoPor: vacio(v.pddAprobadoPor),
    pddConIa: v.pddConIa,
    ...Object.fromEntries(PDD_SECCIONES.map((s) => [s.key, vacio(v[s.key])])),
  };
}

// The process's PDD: survey notes, an optional AI draft built from them, the
// sections, and the client's approval. An AI draft only fills the form: it's
// saved when the consultant has reviewed it.
export function PddEditor({ proceso, iaConfigurada, iaModelo }: { proceso: ProcesoProyecto; iaConfigurada: boolean; iaModelo: string }) {
  const router = useRouter();
  const [redactando, setRedactando] = useState(false);
  const [borradorIa, setBorradorIa] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(proceso) });
  const pddEstado = useWatch({ control, name: "pddEstado" });
  const input = (hasError: boolean) => `${INPUT_BASE} ${inputState(hasError)}`;

  useEffect(() => {
    if (!isDirty) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [isDirty]);

  async function redactar() {
    const v = getValues();
    if (!v.notasLevantamiento.trim() && !proceso.comoSeHaceHoy) {
      sileo.error({ title: "Faltan las notas", description: "Escribe lo que levantaste con el cliente: es lo que la IA usa para redactar." });
      return;
    }
    const conTexto = PDD_SECCIONES.some((s) => v[s.key].trim() !== "");
    if (conTexto && !window.confirm("La IA usará lo que ya escribiste y propondrá todas las secciones. ¿Reemplazar el texto del formulario con su borrador? Nada se guarda hasta que lo revises.")) return;

    setRedactando(true);
    const result = await panelFetch<Record<PddKey | "modelo", string>>(`proyectos/procesos/${proceso.id}/pdd-ia`, { method: "POST", body: toBody(v) });
    setRedactando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo redactar con IA", description: result.message });
      return;
    }
    for (const s of PDD_SECCIONES) setValue(s.key, result.data[s.key] ?? "", { shouldDirty: true });
    setValue("pddConIa", true, { shouldDirty: true });
    setBorradorIa(true);
    sileo.success({ title: "Borrador listo", description: "Revisa cada sección, sobre todo las preguntas abiertas, antes de guardar." });
  }

  const onSubmit = handleSubmit(async (v) => {
    const result = await panelFetch(`proyectos/procesos/${proceso.id}`, { method: "PUT", body: toBody(v) });
    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar el PDD", description: result.message });
      return;
    }
    sileo.success({
      title: "PDD guardado",
      description: v.pddEstado === "aprobado" && proceso.pddEstado !== "aprobado" ? "Su tarea de aprobación quedó marcada como hecha." : undefined,
    });
    setBorradorIa(false);
    reset(v);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className={`${CARD} p-6`}>
          <h2 className="text-base font-semibold text-ink-950">Notas del levantamiento</h2>
          <p className="mt-1 text-sm text-ink-500">Lo que contó el cliente en la sesión: cómo lo hacen, qué sistemas usan, qué casos raros aparecen.</p>
          <label htmlFor="pdd-notas" className="sr-only">
            Notas del levantamiento
          </label>
          <textarea
            id="pdd-notas"
            rows={7}
            className={`${input(!!errors.notasLevantamiento)} mt-3 h-auto resize-y py-2.5`}
            {...register("notasLevantamiento")}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-xs text-ink-500">
              {iaConfigurada
                ? `Con IA (${iaModelo}): se envían a Anthropic los datos del proceso, estas notas y lo escrito en el PDD. No incluyas contraseñas ni datos personales.`
                : "La redacción con IA no está activa: falta configurar ANTHROPIC_API_KEY en el servidor."}
            </p>
            <button type="button" onClick={redactar} disabled={!iaConfigurada || redactando} className={BUTTON_PRIMARY}>
              {redactando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {redactando ? "Redactando… (hasta un minuto)" : "Redactar con IA"}
            </button>
          </div>
        </section>

        {borradorIa && (
          <p role="status" className="flex items-start gap-2.5 rounded-lg border border-brand-300 bg-brand-50 px-4 py-3 text-sm text-ink-700">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
            Borrador de IA sin guardar. Revisa que cada paso, sistema y regla sea correcto: la IA solo sabe lo que dicen las notas.
          </p>
        )}

        <section className={`${CARD} grid gap-5 p-6`}>
          <h2 className="text-base font-semibold text-ink-950">PDD</h2>
          {PDD_SECCIONES.map((s) => (
            <Field key={s.key} id={`pdd-${s.key}`} label={s.label} hint={s.ayuda} error={errors[s.key]?.message}>
              <textarea
                id={`pdd-${s.key}`}
                rows={s.lista ? 5 : 3}
                className={`${input(!!errors[s.key])} h-auto resize-y py-2.5`}
                {...register(s.key)}
              />
            </Field>
          ))}
        </section>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-0 xl:self-start">
        <section className={`${CARD} flex flex-col gap-4 p-5`}>
          <h2 className="text-base font-semibold text-ink-950">Proceso</h2>
          <Field id="pdd-nombre" label="Nombre" error={errors.nombre?.message}>
            <input id="pdd-nombre" className={input(!!errors.nombre)} {...register("nombre")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="pdd-area" label="Área" optional>
              <input id="pdd-area" className={input(false)} {...register("area")} />
            </Field>
            <Field id="pdd-servicio" label="Solución">
              <select id="pdd-servicio" className={input(false)} {...register("servicio")}>
                {SERVICIOS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field id="pdd-etapa" label="Etapa">
            <select id="pdd-etapa" className={input(false)} {...register("etapa")}>
              {ETAPAS_DESARROLLO.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="pdd-estado" label="Estado del PDD" hint={proceso.pddEstado === "aprobado" ? "Cambiar el texto de un PDD aprobado crea una versión nueva, en borrador." : undefined}>
            <select id="pdd-estado" className={input(false)} {...register("pddEstado")}>
              {PDD_ESTADOS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          {pddEstado === "aprobado" && (
            <Field id="pdd-aprobado-por" label="Aprobado por (cliente)" error={errors.pddAprobadoPor?.message}>
              <input id="pdd-aprobado-por" placeholder={proceso.contactoNombre ?? "Nombre y cargo"} className={input(!!errors.pddAprobadoPor)} {...register("pddAprobadoPor")} />
            </Field>
          )}
        </section>
        <button type="submit" disabled={isSubmitting || !isDirty} className={BUTTON_PRIMARY}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isDirty ? "Guardar PDD" : "Guardado"}
        </button>
        <Link href={`/dashboard/proyectos/${proceso.proyectoId}/procesos/${proceso.id}/pdd`} className={BUTTON_SECONDARY}>
          <FileText className="h-4 w-4" />
          Ver documento
        </Link>
      </aside>
    </form>
  );
}
