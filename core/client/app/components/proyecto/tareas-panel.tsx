"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { sileo } from "sileo";
import { MotivoPerdidaDialog } from "@/components/comercial/motivo-perdida-dialog";
import { Field } from "@/components/ui/field";
import { BUTTON_DANGER, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import type { TeamUser } from "@/lib/comercial";
import { formatDay } from "@/lib/format-date";
import { HITO_ESTADOS, HITO_ESTADO_LABELS, TAREA_ESTADOS, type Hito, type Tarea } from "@/lib/proyecto";
import { panelFetch } from "@/lib/panel-api";
import { UsuarioOptions } from "@/components/ui/usuario-options";

type Cambios = Partial<Pick<Tarea, "titulo" | "hitoId" | "estado" | "responsableId" | "fechaLimite" | "bloqueo">>;

// Compact controls for task rows (INPUT_BASE is full-width; these size themselves).
const SELECT =
  "h-8 rounded-md border border-line bg-white px-2 text-xs text-ink-950 outline-none transition-colors focus:border-brand-500 disabled:opacity-60";

// Add or edit a milestone (its dates drive the timeline). Mounted only while
// open, so it starts from the milestone's current values.
function HitoDialog({ proyectoId, hito, onClose }: { proyectoId: number; hito: Hito | null; onClose: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(
    hito
      ? { nombre: hito.nombre, descripcion: hito.descripcion ?? "", estado: hito.estado, fechaInicio: hito.fechaInicio.slice(0, 10), fechaFin: hito.fechaFin.slice(0, 10) }
      : { nombre: "", descripcion: "", estado: "pendiente", fechaInicio: "", fechaFin: "" },
  );
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.fechaInicio || !form.fechaFin) {
      sileo.error({ title: "Faltan datos", description: "El hito necesita nombre y fechas." });
      return;
    }
    setGuardando(true);
    const body = { ...form, nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null };
    const result = hito
      ? await panelFetch(`proyectos/hitos/${hito.id}`, { method: "PUT", body })
      : await panelFetch(`proyectos/${proyectoId}/hitos`, { method: "POST", body });
    setGuardando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar el hito", description: result.message });
      return;
    }
    onClose();
    router.refresh();
  }

  async function eliminar() {
    if (!hito || !window.confirm(`¿Quitar el hito “${hito.nombre}”? Sus tareas quedan en el proyecto, sin hito.`)) return;
    const result = await panelFetch(`proyectos/hitos/${hito.id}`, { method: "DELETE" });
    if (!result.ok) {
      sileo.error({ title: "No se pudo quitar el hito", description: result.message });
      return;
    }
    onClose();
    router.refresh();
  }

  const input = `${INPUT_BASE} ${inputState(false)}`;
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-lg bg-white p-0 shadow-flyout backdrop:bg-ink-950/40"
    >
      <form onSubmit={guardar} className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-950">{hito ? "Editar hito" : "Nuevo hito"}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-md p-1 text-ink-500 hover:bg-brand-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Field id="hito-nombre" label="Nombre">
          <input id="hito-nombre" value={form.nombre} maxLength={200} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={input} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="hito-inicio" label="Inicio">
            <input id="hito-inicio" type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} className={input} />
          </Field>
          <Field id="hito-fin" label="Fin">
            <input id="hito-fin" type="date" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} className={input} />
          </Field>
        </div>
        <Field id="hito-estado" label="Estado" hint="Con tareas, el estado sigue a sus tareas.">
          <select id="hito-estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={input}>
            {HITO_ESTADOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="hito-descripcion" label="Descripción" optional>
          <input id="hito-descripcion" value={form.descripcion} maxLength={1000} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className={input} />
        </Field>
        <div className="flex items-center justify-between gap-2 pt-2">
          {hito ? (
            <button type="button" onClick={eliminar} className={BUTTON_DANGER}>
              <Trash2 className="h-4 w-4" />
              Quitar
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className={BUTTON_PRIMARY}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}

function NuevaTarea({ proyectoId, hitoId, fechaLimite }: { proyectoId: number; hitoId: number | null; fechaLimite: string | null }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setGuardando(true);
    const result = await panelFetch(`proyectos/${proyectoId}/tareas`, {
      method: "POST",
      body: { titulo: titulo.trim(), hitoId, estado: "pendiente", fechaLimite: fechaLimite?.slice(0, 10) ?? null },
    });
    setGuardando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo agregar la tarea", description: result.message });
      return;
    }
    setTitulo("");
    router.refresh();
  }

  return (
    <form onSubmit={agregar} className="flex items-center gap-2 px-5 py-2.5">
      <Plus className="h-4 w-4 shrink-0 text-ink-400" />
      <label className="sr-only" htmlFor={`nueva-tarea-${hitoId ?? "sin"}`}>
        Nueva tarea
      </label>
      <input
        id={`nueva-tarea-${hitoId ?? "sin"}`}
        value={titulo}
        maxLength={300}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Agregar una tarea…"
        className="h-8 min-w-0 flex-1 bg-transparent text-sm text-ink-950 outline-none placeholder:text-ink-400"
      />
      {titulo.trim() && (
        <button type="submit" disabled={guardando} className={`${BUTTON_PRIMARY} h-8 px-3 text-xs`}>
          {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Agregar
        </button>
      )}
    </form>
  );
}

// Tasks by milestone: tick them off, change status, owner or due date in
// place. Milestones follow their tasks; blocking a task asks what it's
// waiting on.
export function TareasPanel({
  proyectoId,
  hitos,
  tareas,
  users,
}: {
  proyectoId: number;
  hitos: Hito[];
  tareas: Tarea[];
  users: TeamUser[];
}) {
  const router = useRouter();
  const [cambios, setCambios] = useState<Record<number, Cambios>>({});
  const [ocultarHechas, setOcultarHechas] = useState(false);
  const [editandoHito, setEditandoHito] = useState<Hito | "nuevo" | null>(null);
  const [bloqueando, setBloqueando] = useState<Tarea | null>(null);

  const vista = tareas.map((t) => ({ ...t, ...cambios[t.id] }));

  async function actualizar(t: Tarea, c: Cambios) {
    const siguiente = { ...t, ...c };
    setCambios((prev) => ({ ...prev, [t.id]: { ...prev[t.id], ...c } }));
    const result = await panelFetch(`proyectos/tareas/${t.id}`, {
      method: "PUT",
      body: {
        titulo: siguiente.titulo,
        hitoId: siguiente.hitoId,
        estado: siguiente.estado,
        responsableId: siguiente.responsableId,
        fechaLimite: siguiente.fechaLimite?.slice(0, 10) ?? null,
        bloqueo: siguiente.bloqueo,
      },
    });
    if (!result.ok) {
      setCambios((prev) => {
        const next = { ...prev };
        delete next[t.id];
        return next;
      });
      sileo.error({ title: "No se pudo actualizar la tarea", description: result.message });
      return;
    }
    router.refresh();
  }

  async function eliminar(t: Tarea) {
    if (!window.confirm(`¿Quitar la tarea “${t.titulo}”?`)) return;
    const result = await panelFetch(`proyectos/tareas/${t.id}`, { method: "DELETE" });
    if (!result.ok) {
      sileo.error({ title: "No se pudo quitar la tarea", description: result.message });
      return;
    }
    router.refresh();
  }

  const grupos = [
    ...hitos.map((h) => ({ hito: h as Hito | null, tareas: vista.filter((t) => t.hitoId === h.id) })),
    { hito: null, tareas: vista.filter((t) => t.hitoId === null || !hitos.some((h) => h.id === t.hitoId)) },
  ].filter((g) => g.hito !== null || g.tareas.length > 0);

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <h2 className="text-base font-semibold text-ink-950">Tareas</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-500">
            <input type="checkbox" checked={ocultarHechas} onChange={(e) => setOcultarHechas(e.target.checked)} className="h-4 w-4 accent-brand-700" />
            Ocultar hechas
          </label>
          <button type="button" onClick={() => setEditandoHito("nuevo")} className={`${BUTTON_SECONDARY} h-9 px-3`}>
            <Plus className="h-4 w-4" />
            Hito
          </button>
        </div>
      </div>

      {grupos.map(({ hito, tareas: lista }) => {
        const hechas = lista.filter((t) => t.estado === "hecha").length;
        const visibles = ocultarHechas ? lista.filter((t) => t.estado !== "hecha") : lista;
        return (
          <div key={hito?.id ?? "sin-hito"} className="border-t border-line">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-brand-50 px-5 py-2.5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-sm font-semibold text-ink-950">{hito?.nombre ?? "Sin hito"}</p>
                {hito && (
                  <p className={`text-xs ${hito.atrasado ? "font-semibold text-red-600" : "text-ink-500"}`}>
                    {formatDay(hito.fechaInicio)} – {formatDay(hito.fechaFin)} · {HITO_ESTADO_LABELS[hito.estado]}
                    {hito.atrasado && " · atrasado"}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs tabular-nums text-ink-500">
                  {hechas}/{lista.length}
                </span>
                {hito && (
                  <button type="button" onClick={() => setEditandoHito(hito)} aria-label={`Editar ${hito.nombre}`} className="rounded-md p-1 text-ink-500 hover:bg-white hover:text-ink-950">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <ul className="divide-y divide-line">
              {visibles.map((t) => {
                const hecha = t.estado === "hecha";
                return (
                  <li key={t.id} className="group px-5 py-2.5">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={hecha}
                        onChange={() => actualizar(t, { estado: hecha ? "pendiente" : "hecha", bloqueo: null })}
                        aria-label={hecha ? `Marcar “${t.titulo}” como pendiente` : `Marcar “${t.titulo}” como hecha`}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${hecha ? "text-ink-400 line-through" : "text-ink-950"}`}>{t.titulo}</p>
                        {hecha && t.completadaAtUtc && (
                          <p className="text-xs text-ink-400">
                            Hecha el {formatDay(t.completadaAtUtc)}
                            {t.responsableNombre && ` · ${t.responsableNombre}`}
                          </p>
                        )}
                        {t.estado === "bloqueada" && t.bloqueo && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-red-600">
                            <Ban className="h-3 w-3" />
                            {t.bloqueo}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminar(t)}
                        aria-label={`Quitar “${t.titulo}”`}
                        className="rounded-md p-1 text-ink-400 opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Open tasks: status, owner and due date under the title. */}
                    {!hecha && (
                      <div className="mt-2 flex flex-wrap gap-2 pl-7">
                        <select
                          aria-label="Estado"
                          value={t.estado}
                          onChange={(e) => (e.target.value === "bloqueada" ? setBloqueando(t) : actualizar(t, { estado: e.target.value, bloqueo: null }))}
                          className={`${SELECT} w-36 ${t.estado === "bloqueada" ? "border-red-300 text-red-700" : ""}`}
                        >
                          {TAREA_ESTADOS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label="Responsable"
                          value={t.responsableId ?? ""}
                          onChange={(e) => actualizar(t, { responsableId: e.target.value ? Number(e.target.value) : null })}
                          className={`${SELECT} w-44`}
                        >
                          <option value="">Sin responsable</option>
                          <UsuarioOptions users={users} actual={t.responsableId} />
                        </select>
                        <input
                          aria-label="Fecha límite"
                          type="date"
                          value={t.fechaLimite?.slice(0, 10) ?? ""}
                          onChange={(e) => actualizar(t, { fechaLimite: e.target.value || null })}
                          className={`${SELECT} w-36 ${t.vencida ? "border-red-300 text-red-700" : ""}`}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <NuevaTarea proyectoId={proyectoId} hitoId={hito?.id ?? null} fechaLimite={hito?.fechaFin ?? null} />
          </div>
        );
      })}

      {editandoHito !== null && (
        <HitoDialog
          key={editandoHito === "nuevo" ? "nuevo" : editandoHito.id}
          proyectoId={proyectoId}
          hito={editandoHito === "nuevo" ? null : editandoHito}
          onClose={() => setEditandoHito(null)}
        />
      )}
      <MotivoPerdidaDialog
        open={bloqueando !== null}
        titulo={bloqueando?.titulo}
        encabezado="Tarea bloqueada"
        pregunta="¿Qué la está bloqueando?"
        confirmar="Marcar como bloqueada"
        onCancel={() => setBloqueando(null)}
        onConfirm={(motivo) => {
          if (bloqueando) actualizar(bloqueando, { estado: "bloqueada", bloqueo: motivo });
          setBloqueando(null);
        }}
      />
    </section>
  );
}
