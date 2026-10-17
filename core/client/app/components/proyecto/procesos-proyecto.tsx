"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Plus } from "lucide-react";
import { sileo } from "sileo";
import { EtapaDesarrolloBadge, PddEstadoBadge } from "@/components/ui/proyecto-badges";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { SERVICIOS, SERVICIO_CORTO } from "@/lib/comercial";
import type { ProcesoProyectoItem } from "@/lib/proyecto";
import { panelFetch } from "@/lib/panel-api";

// The processes the project automates, each with its stage and its PDD.
export function ProcesosProyecto({ proyectoId, procesos }: { proyectoId: number; procesos: ProcesoProyectoItem[] }) {
  const router = useRouter();
  const [agregando, setAgregando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [servicio, setServicio] = useState("rpa");
  const [guardando, setGuardando] = useState(false);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (nombre.trim().length < 3) return;
    setGuardando(true);
    const result = await panelFetch<{ id: number }>(`proyectos/${proyectoId}/procesos`, { method: "POST", body: { nombre: nombre.trim(), servicio } });
    setGuardando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo agregar el proceso", description: result.message });
      return;
    }
    router.push(`/dashboard/proyectos/${proyectoId}/procesos/${result.data.id}`);
  }

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 p-5">
        <h2 className="text-base font-semibold text-ink-950">
          Procesos <span className="font-normal text-ink-500">{procesos.length}</span>
        </h2>
        {!agregando && (
          <button type="button" onClick={() => setAgregando(true)} className={`${BUTTON_SECONDARY} h-9 px-3`}>
            <Plus className="h-4 w-4" />
            Proceso
          </button>
        )}
      </div>
      {agregando && (
        <form onSubmit={agregar} className="flex flex-wrap gap-2 border-t border-line bg-brand-50 p-4">
          <label htmlFor="nuevo-proceso" className="sr-only">
            Nombre del proceso
          </label>
          <input
            id="nuevo-proceso"
            autoFocus
            value={nombre}
            maxLength={200}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del proceso"
            className={`${INPUT_BASE} ${inputState(false)} h-9 min-w-0 flex-1`}
          />
          <select aria-label="Solución" value={servicio} onChange={(e) => setServicio(e.target.value)} className={`${INPUT_BASE} ${inputState(false)} h-9 w-auto`}>
            {SERVICIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {SERVICIO_CORTO[s.value]}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setAgregando(false)} className={`${BUTTON_SECONDARY} h-9 px-3`}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando || nombre.trim().length < 3} className={`${BUTTON_PRIMARY} h-9 px-3`}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            Agregar
          </button>
        </form>
      )}
      {procesos.length === 0 ? (
        <p className="border-t border-line px-5 py-4 text-sm text-ink-500">Sin procesos.</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {procesos.map((p) => (
            <li key={p.id}>
              <Link href={`/dashboard/proyectos/${proyectoId}/procesos/${p.id}`} className="group flex items-center justify-between gap-3 px-5 py-3 hover:bg-brand-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-950 group-hover:underline">{p.nombre}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <EtapaDesarrolloBadge etapa={p.etapa} />
                    <PddEstadoBadge estado={p.pddEstado} version={p.pddVersion} />
                    {!p.tienePdd && <span className="text-xs text-ink-400">sin redactar</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
