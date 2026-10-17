"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { sileo } from "sileo";
import { EmpresaPicker, type EmpresaOption } from "@/components/comercial/empresa-picker";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import type { TeamUser } from "@/lib/comercial";
import { panelFetch } from "@/lib/panel-api";
import { UsuarioOptions } from "@/components/ui/usuario-options";

// Start a project: from an accepted proposal (its phases become dated
// milestones, its scope the processes and their tasks) or blank.
export function NuevoProyectoForm({
  propuesta,
  users,
  defaultResponsableId,
  inicioSugerido,
}: {
  propuesta?: { id: number; nombre: string; titulo: string; empresaNombre: string; semanas: number; procesos: number };
  users: TeamUser[];
  defaultResponsableId?: number;
  inicioSugerido: string;
}) {
  const router = useRouter();
  const [empresa, setEmpresa] = useState<EmpresaOption | null>(null);
  const [nombre, setNombre] = useState(propuesta?.titulo ?? "Proyecto de automatización");
  const [inicio, setInicio] = useState(inicioSugerido);
  const [responsableId, setResponsableId] = useState(defaultResponsableId?.toString() ?? "");
  const [guardando, setGuardando] = useState(false);
  const input = `${INPUT_BASE} ${inputState(false)}`;

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!propuesta && !empresa) {
      sileo.error({ title: "Falta la empresa", description: "Elige para quién es el proyecto." });
      return;
    }
    setGuardando(true);
    const result = await panelFetch<{ id: number; proyectoId?: number }>("proyectos", {
      method: "POST",
      body: {
        propuestaId: propuesta?.id ?? null,
        empresaId: propuesta ? null : empresa?.id,
        nombre: nombre.trim(),
        fechaInicio: inicio || null,
        responsableId: responsableId ? Number(responsableId) : null,
      },
    });
    setGuardando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo crear el proyecto", description: result.message });
      return;
    }
    sileo.success({ title: "Proyecto creado", description: propuesta ? "Con sus hitos, procesos y tareas." : undefined });
    router.push(`/dashboard/proyectos/${result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={crear} className={`${CARD} max-w-2xl`}>
      <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <Field id="np-cliente" label="Cliente" className="sm:col-span-2">
          {propuesta ? (
            <p className={`${input} flex items-center bg-brand-50 font-medium`}>
              {propuesta.empresaNombre} · {propuesta.nombre}
            </p>
          ) : (
            <EmpresaPicker id="np-cliente" value={empresa} onChange={setEmpresa} />
          )}
        </Field>
        <Field id="np-nombre" label="Nombre" className="sm:col-span-2">
          <input id="np-nombre" value={nombre} maxLength={200} onChange={(e) => setNombre(e.target.value)} className={input} />
        </Field>
        <Field id="np-inicio" label="Inicio" hint="Un lunes, normalmente.">
          <input id="np-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className={input} />
        </Field>
        <Field id="np-responsable" label="Jefe de proyecto">
          <select id="np-responsable" value={responsableId} onChange={(e) => setResponsableId(e.target.value)} className={input}>
            <option value="">Sin asignar</option>
            <UsuarioOptions users={users} />
          </select>
        </Field>
        {propuesta && (
          <p className="text-xs text-ink-500 sm:col-span-2">
            Se crean {propuesta.semanas} semanas de hitos a partir del inicio, {propuesta.procesos}{" "}
            {propuesta.procesos === 1 ? "proceso" : "procesos"} con su PDD por redactar y las tareas de cada uno.
          </p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <Link href={propuesta ? `/dashboard/propuestas/${propuesta.id}` : "/dashboard/proyectos"} className={BUTTON_SECONDARY}>
          Cancelar
        </Link>
        <button type="submit" disabled={guardando} className={BUTTON_PRIMARY}>
          {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear proyecto
        </button>
      </div>
    </form>
  );
}
