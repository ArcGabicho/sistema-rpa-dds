"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import type { Empresa } from "@/lib/comercial";
import { empresaSchema, idOrNull, orNull, type EmpresaValues } from "@/lib/comercial-schema";
import { panelFetch } from "@/lib/panel-api";

function toValues(empresa?: Empresa): EmpresaValues {
  return {
    nombreComercial: empresa?.nombreComercial ?? "",
    razonSocial: empresa?.razonSocial ?? "",
    ruc: empresa?.ruc ?? "",
    rubro: empresa?.rubro ?? "",
    sitioWeb: empresa?.sitioWeb ?? "",
    direccion: empresa?.direccion ?? "",
    distrito: empresa?.distrito ?? "",
    provincia: empresa?.provincia ?? "",
    estado: (empresa?.estado as EmpresaValues["estado"]) ?? "prospecto",
    origen: empresa?.origen ?? "",
    responsableId: empresa?.responsableId?.toString() ?? "",
  };
}

// Create (no empresa) or edit (empresa given) a company.
export function useEmpresaForm(empresa?: Empresa) {
  const router = useRouter();
  const form = useForm<EmpresaValues>({
    resolver: zodResolver(empresaSchema),
    defaultValues: toValues(empresa),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const body = {
      nombreComercial: values.nombreComercial.trim(),
      razonSocial: orNull(values.razonSocial),
      ruc: orNull(values.ruc),
      rubro: orNull(values.rubro),
      sitioWeb: orNull(values.sitioWeb),
      direccion: orNull(values.direccion),
      distrito: orNull(values.distrito),
      provincia: orNull(values.provincia),
      estado: values.estado,
      origen: orNull(values.origen),
      responsableId: idOrNull(values.responsableId),
    };

    const result = empresa
      ? await panelFetch(`empresas/${empresa.id}`, { method: "PUT", body })
      : await panelFetch<{ id: number }>("empresas", { method: "POST", body });

    if (!result.ok) {
      if (result.status === 409) form.setError("ruc", { message: result.message });
      sileo.error({ title: "No se pudo guardar la empresa", description: result.message });
      return;
    }

    const id = empresa?.id ?? (result.data as { id: number }).id;
    sileo.success({ title: empresa ? "Empresa actualizada" : "Empresa creada" });
    router.push(`/dashboard/empresas/${id}`);
    router.refresh();
  });

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    onSubmit,
  };
}
