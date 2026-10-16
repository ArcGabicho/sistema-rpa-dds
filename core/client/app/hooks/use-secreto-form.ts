"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import type { EmpresaOption } from "@/components/comercial/empresa-picker";
import type { Secreto } from "@/lib/boveda";
import { secretoCreateSchema, secretoEditSchema, type SecretoCreateValues } from "@/lib/boveda-schema";
import { orNull } from "@/lib/comercial-schema";
import { panelFetch } from "@/lib/panel-api";

// Create a secret (with its value) or edit one's metadata. The company is
// optional: without one, the secret is DDS's own.
export function useSecretoForm({ secreto, empresa }: { secreto?: Secreto; empresa?: EmpresaOption }) {
  const router = useRouter();
  const [empresaOption, setEmpresaOption] = useState<EmpresaOption | null>(
    secreto?.empresaId
      ? { id: secreto.empresaId, nombreComercial: secreto.empresaNombre ?? "—", ruc: null }
      : (empresa ?? null),
  );

  const form = useForm<SecretoCreateValues>({
    resolver: zodResolver(secreto ? secretoEditSchema : secretoCreateSchema),
    defaultValues: {
      nombre: secreto?.nombre ?? "",
      tipo: (secreto?.tipo as SecretoCreateValues["tipo"]) ?? "credencial",
      usuario: secreto?.usuario ?? "",
      url: secreto?.url ?? "",
      notas: secreto?.notas ?? "",
      venceEl: secreto?.venceEl?.slice(0, 10) ?? "",
      restringido: secreto?.restringido ?? false,
      valor: "",
    },
  });
  const tipo = useWatch({ control: form.control, name: "tipo" });

  const onSubmit = form.handleSubmit(async (values) => {
    const metadata = {
      nombre: values.nombre.trim(),
      tipo: values.tipo,
      empresaId: empresaOption?.id ?? null,
      usuario: orNull(values.usuario),
      url: orNull(values.url),
      notas: orNull(values.notas),
      venceEl: orNull(values.venceEl),
      restringido: values.restringido,
    };
    const result = secreto
      ? await panelFetch(`boveda/${secreto.id}`, { method: "PUT", body: metadata })
      : await panelFetch<{ id: number }>("boveda", { method: "POST", body: { ...metadata, valor: values.valor } });

    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar", description: result.message });
      return;
    }
    const id = secreto?.id ?? (result.data as { id: number }).id;
    sileo.success({ title: secreto ? "Datos actualizados" : "Guardado en la bóveda", description: metadata.nombre });
    router.push(`/dashboard/boveda/${id}`);
    router.refresh();
  });

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    setValor: (valor: string) => form.setValue("valor", valor, { shouldValidate: form.formState.isSubmitted }),
    tipo,
    empresaOption,
    setEmpresaOption,
    onSubmit,
  };
}
