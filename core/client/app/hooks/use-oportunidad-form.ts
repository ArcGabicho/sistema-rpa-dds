"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import type { EmpresaOption } from "@/components/comercial/empresa-picker";
import type { Contacto, Empresa, Oportunidad } from "@/lib/comercial";
import { idOrNull, oportunidadSchema, orNull, type OportunidadValues } from "@/lib/comercial-schema";
import { panelFetch } from "@/lib/panel-api";

const day = (value: string | null) => value?.slice(0, 10) ?? "";

// Create (no oportunidad) or edit an opportunity. On create the company can
// be preset (coming from its page) or picked; its contacts load on pick.
export function useOportunidadForm({
  oportunidad,
  empresa,
  defaultResponsableId,
}: {
  oportunidad?: Oportunidad;
  empresa?: Pick<Empresa, "id" | "nombreComercial" | "ruc" | "contactos">;
  defaultResponsableId?: number;
}) {
  const router = useRouter();
  const [empresaOption, setEmpresaOption] = useState<EmpresaOption | null>(
    oportunidad
      ? { id: oportunidad.empresaId, nombreComercial: oportunidad.empresaNombre, ruc: null }
      : empresa
        ? { id: empresa.id, nombreComercial: empresa.nombreComercial, ruc: empresa.ruc }
        : null,
  );
  const [contactos, setContactos] = useState<Contacto[]>(oportunidad?.contactosEmpresa ?? empresa?.contactos ?? []);

  const form = useForm<OportunidadValues>({
    resolver: zodResolver(oportunidadSchema),
    defaultValues: {
      empresaId: empresaOption?.id ?? 0,
      contactoId: oportunidad?.contactoId?.toString() ?? "",
      titulo: oportunidad?.titulo ?? "",
      servicio: (oportunidad?.servicio as OportunidadValues["servicio"]) ?? "rpa",
      etapa: oportunidad?.etapa ?? "nuevo",
      valorEstimado: oportunidad?.valorEstimado?.toString() ?? "",
      fechaCierreEstimada: day(oportunidad?.fechaCierreEstimada ?? null),
      responsableId: (oportunidad ? oportunidad.responsableId : defaultResponsableId)?.toString() ?? "",
      proximaAccion: oportunidad?.proximaAccion ?? "",
      proximaAccionFecha: day(oportunidad?.proximaAccionFecha ?? null),
      motivoPerdida: oportunidad?.motivoPerdida ?? "",
    },
  });

  const etapa = useWatch({ control: form.control, name: "etapa" });

  // Picking another company: reload its contacts and drop the old contact.
  const pickedId = empresaOption?.id;
  const presetId = oportunidad?.empresaId ?? empresa?.id;
  useEffect(() => {
    if (!pickedId || pickedId === presetId) return;
    let cancelled = false;
    panelFetch<Empresa>(`empresas/${pickedId}`).then((result) => {
      if (!cancelled) setContactos(result.ok ? result.data.contactos : []);
    });
    return () => {
      cancelled = true;
    };
  }, [pickedId, presetId]);

  function pickEmpresa(option: EmpresaOption | null) {
    setEmpresaOption(option);
    setContactos([]);
    form.setValue("contactoId", "");
    form.setValue("empresaId", option?.id ?? 0, { shouldValidate: form.formState.isSubmitted });
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const common = {
      titulo: values.titulo.trim(),
      servicio: values.servicio,
      etapa: values.etapa,
      valorEstimado: values.valorEstimado === "" ? null : Number(values.valorEstimado),
      fechaCierreEstimada: orNull(values.fechaCierreEstimada),
      contactoId: idOrNull(values.contactoId),
      responsableId: idOrNull(values.responsableId),
      proximaAccion: orNull(values.proximaAccion),
      proximaAccionFecha: orNull(values.proximaAccion) ? orNull(values.proximaAccionFecha) : null,
    };

    const result = oportunidad
      ? await panelFetch(`oportunidades/${oportunidad.id}`, {
          method: "PUT",
          body: { ...common, motivoPerdida: values.etapa === "perdida" ? orNull(values.motivoPerdida) : null },
        })
      : await panelFetch<{ id: number }>("oportunidades", {
          method: "POST",
          body: { ...common, empresaId: values.empresaId },
        });

    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar la oportunidad", description: result.message });
      return;
    }

    const id = oportunidad?.id ?? (result.data as { id: number }).id;
    sileo.success({ title: oportunidad ? "Oportunidad actualizada" : "Oportunidad creada" });
    router.push(`/dashboard/oportunidades/${id}`);
    router.refresh();
  });

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    etapa,
    empresaOption,
    pickEmpresa,
    contactos,
    onSubmit,
  };
}
