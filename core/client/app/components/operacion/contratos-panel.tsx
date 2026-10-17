"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Handshake, Loader2, Pencil, Plus, RefreshCw, X } from "lucide-react";
import { sileo } from "sileo";
import { EmpresaPicker, type EmpresaOption } from "@/components/comercial/empresa-picker";
import { EtapaBadge } from "@/components/ui/comercial-badges";
import { Field } from "@/components/ui/field";
import { PlazoBadge } from "@/components/ui/operacion-badges";
import { BUTTON_DANGER, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { formatDay } from "@/lib/format-date";
import type { Contrato } from "@/lib/operacion";
import { formatMoneda } from "@/lib/propuesta";
import { panelFetch } from "@/lib/panel-api";

const ABIERTAS = ["nuevo", "contactado", "diagnostico", "propuesta", "negociacion"];

function useModal() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return ref;
}

const DIALOG = "m-auto max-h-[92dvh] w-[min(34rem,calc(100%-1.5rem))] overflow-hidden rounded-lg bg-white p-0 shadow-flyout backdrop:bg-ink-950/40";

function ContratoDialog({ contrato, esAdmin, onClose }: { contrato: Contrato | null; esAdmin: boolean; onClose: () => void }) {
  const router = useRouter();
  const ref = useModal();
  const [empresa, setEmpresa] = useState<EmpresaOption | null>(contrato ? { id: contrato.empresaId, nombreComercial: contrato.empresaNombre, ruc: null } : null);
  const [form, setForm] = useState({
    nombre: contrato?.nombre ?? "Soporte, monitoreo y operación",
    montoMensual: contrato?.montoMensual.toString() ?? "",
    moneda: contrato?.moneda ?? "PEN",
    fechaInicio: contrato?.fechaInicio.slice(0, 10) ?? "",
    fechaFin: contrato?.fechaFin.slice(0, 10) ?? "",
    estado: contrato?.estado ?? "vigente",
    notas: contrato?.notas ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const set = (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const input = `${INPUT_BASE} ${inputState(false)}`;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!empresa || form.nombre.trim().length < 3 || !form.fechaInicio || !form.fechaFin || form.montoMensual === "") {
      sileo.error({ title: "Faltan datos", description: "El contrato necesita empresa, nombre, monto y fechas." });
      return;
    }
    setGuardando(true);
    const body = {
      empresaId: empresa.id,
      propuestaId: contrato?.propuestaId ?? null,
      nombre: form.nombre.trim(),
      estado: form.estado,
      montoMensual: Number(form.montoMensual),
      moneda: form.moneda,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      notas: form.notas.trim() || null,
    };
    const result = contrato
      ? await panelFetch(`vencimientos/contratos/${contrato.id}`, { method: "PUT", body })
      : await panelFetch("vencimientos/contratos", { method: "POST", body });
    setGuardando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar el contrato", description: result.message });
      return;
    }
    sileo.success({ title: contrato ? "Contrato actualizado" : "Contrato registrado" });
    onClose();
    router.refresh();
  }

  async function eliminar() {
    if (!contrato || !window.confirm(`¿Eliminar el contrato “${contrato.nombre}” de ${contrato.empresaNombre}? Esta acción no se puede deshacer.`)) return;
    const result = await panelFetch(`vencimientos/contratos/${contrato.id}`, { method: "DELETE" });
    if (!result.ok) {
      sileo.error({ title: "No se pudo eliminar", description: result.message });
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <dialog ref={ref} onCancel={(e) => {
        e.preventDefault();
        onClose();
      }} className={DIALOG}>
      <form onSubmit={guardar} className="flex max-h-[92dvh] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="text-base font-semibold text-ink-950">{contrato ? "Editar contrato" : "Nuevo contrato de soporte"}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-md p-1.5 text-ink-500 hover:bg-brand-50 hover:text-ink-950">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2">
          <Field id="ct-empresa" label="Cliente" className="sm:col-span-2">
            {contrato ? (
              <p className={`${input} flex items-center bg-brand-50 font-medium`}>{contrato.empresaNombre}</p>
            ) : (
              <EmpresaPicker id="ct-empresa" value={empresa} onChange={setEmpresa} />
            )}
          </Field>
          <Field id="ct-nombre" label="Nombre" className="sm:col-span-2">
            <input id="ct-nombre" value={form.nombre} maxLength={200} onChange={set("nombre")} className={input} />
          </Field>
          <Field id="ct-monto" label="Monto mensual" hint="Antes de IGV.">
            <input id="ct-monto" type="number" min={0} step="any" value={form.montoMensual} onChange={set("montoMensual")} className={input} />
          </Field>
          <Field id="ct-moneda" label="Moneda">
            <select id="ct-moneda" value={form.moneda} onChange={set("moneda")} className={input}>
              <option value="PEN">Soles (S/)</option>
              <option value="USD">Dólares (US$)</option>
            </select>
          </Field>
          <Field id="ct-inicio" label="Inicio">
            <input id="ct-inicio" type="date" value={form.fechaInicio} onChange={set("fechaInicio")} className={input} />
          </Field>
          <Field id="ct-fin" label="Fin">
            <input id="ct-fin" type="date" value={form.fechaFin} onChange={set("fechaFin")} className={input} />
          </Field>
          {contrato && (
            <Field id="ct-estado" label="Estado" hint="Terminado: el cliente no renovó; deja de avisar." className="sm:col-span-2">
              <select id="ct-estado" value={form.estado} onChange={set("estado")} className={input}>
                <option value="vigente">Vigente</option>
                <option value="terminado">Terminado</option>
              </select>
            </Field>
          )}
          <Field id="ct-notas" label="Qué incluye" optional className="sm:col-span-2">
            <textarea id="ct-notas" rows={3} maxLength={1000} value={form.notas} onChange={set("notas")} className={`${input} h-auto resize-y py-2.5`} />
          </Field>
        </div>
        <footer className="flex items-center justify-between gap-2 border-t border-line px-6 py-4">
          {contrato && esAdmin ? (
            <button type="button" onClick={eliminar} className={`${BUTTON_DANGER} px-3`}>
              Eliminar
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
        </footer>
      </form>
    </dialog>
  );
}

function RenovarDialog({ contrato, onClose }: { contrato: Contrato; onClose: () => void }) {
  const router = useRouter();
  const ref = useModal();
  const [meses, setMeses] = useState("12");
  const [monto, setMonto] = useState(contrato.montoMensual.toString());
  const [guardando, setGuardando] = useState(false);
  const input = `${INPUT_BASE} ${inputState(false)}`;
  const abierta = contrato.oportunidadRenovacionId && contrato.oportunidadRenovacionEtapa && ABIERTAS.includes(contrato.oportunidadRenovacionEtapa);

  async function renovar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const result = await panelFetch(`vencimientos/contratos/${contrato.id}/renovar`, {
      method: "POST",
      body: { meses: Number(meses), montoMensual: monto === "" ? null : Number(monto) },
    });
    setGuardando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo renovar", description: result.message });
      return;
    }
    sileo.success({ title: "Contrato renovado", description: abierta ? "Su oportunidad de renovación quedó ganada." : undefined });
    onClose();
    router.refresh();
  }

  return (
    <dialog ref={ref} onCancel={(e) => {
        e.preventDefault();
        onClose();
      }} className={DIALOG}>
      <form onSubmit={renovar} className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-base font-semibold text-ink-950">Renovar contrato</h2>
          <p className="mt-1 text-sm text-ink-500">
            {contrato.empresaNombre} · hoy vence el {formatDay(contrato.fechaFin)}. Se extiende desde esa fecha.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="rn-meses" label="Meses">
            <input id="rn-meses" type="number" min={1} max={36} value={meses} onChange={(e) => setMeses(e.target.value)} className={input} />
          </Field>
          <Field id="rn-monto" label={`Nuevo monto (${contrato.moneda === "USD" ? "US$" : "S/"})`}>
            <input id="rn-monto" type="number" min={0} step="any" value={monto} onChange={(e) => setMonto(e.target.value)} className={input} />
          </Field>
        </div>
        {abierta && <p className="text-xs text-ink-500">La oportunidad «{contrato.oportunidadRenovacionTitulo}» pasa a ganada.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando || !(Number(meses) >= 1 && Number(meses) <= 36)} className={BUTTON_PRIMARY}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            Renovar
          </button>
        </div>
      </form>
    </dialog>
  );
}

// Opens (or goes to) the opportunity to renew a contract.
export function OportunidadRenovacionButton({ contratoId, className = "" }: { contratoId: number; className?: string }) {
  const router = useRouter();
  const [creando, setCreando] = useState(false);

  async function crear() {
    setCreando(true);
    const result = await panelFetch<{ id: number }>(`vencimientos/contratos/${contratoId}/oportunidad`, { method: "POST" });
    setCreando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo crear la oportunidad", description: result.message });
      return;
    }
    sileo.success({ title: "Oportunidad de renovación creada", description: "Con su próxima acción un mes antes del vencimiento." });
    router.push(`/dashboard/oportunidades/${result.data.id}`);
  }

  return (
    <button type="button" onClick={crear} disabled={creando} className={`${BUTTON_SECONDARY} h-9 px-3 ${className}`}>
      {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Handshake className="h-4 w-4" />}
      Oportunidad de renovación
    </button>
  );
}

export function ContratosPanel({ contratos, esAdmin }: { contratos: Contrato[]; esAdmin: boolean }) {
  const [editando, setEditando] = useState<Contrato | null | "nuevo">(null);
  const [renovando, setRenovando] = useState<Contrato | null>(null);

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-base font-semibold text-ink-950">
            Contratos de soporte <span className="font-normal text-ink-500">{contratos.length}</span>
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">Avisan 60 días antes de vencer, para negociar la renovación a tiempo.</p>
        </div>
        <button type="button" onClick={() => setEditando("nuevo")} className={`${BUTTON_SECONDARY} h-9 shrink-0 px-3`}>
          <Plus className="h-4 w-4" />
          Contrato
        </button>
      </div>
      {contratos.length === 0 ? (
        <p className="border-t border-line px-5 py-4 text-sm text-ink-500">Aún no hay contratos de soporte.</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {contratos.map((c) => {
            const oportunidadAbierta = c.oportunidadRenovacionId && c.oportunidadRenovacionEtapa && ABIERTAS.includes(c.oportunidadRenovacionEtapa);
            const avisar = c.estado === "vigente" && (c.vencimiento === "vencido" || c.vencimiento === "por_vencer");
            return (
              <li key={c.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/empresas/${c.empresaId}`} className="font-medium text-ink-950 hover:underline">
                      {c.empresaNombre}
                    </Link>
                    <PlazoBadge estado={c.vencimiento} dias={c.dias} fecha={c.fechaFin} />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {c.nombre} · {formatMoneda(c.montoMensual, c.moneda)} al mes · {formatDay(c.fechaInicio)} – {formatDay(c.fechaFin)}
                    {c.propuestaId && (
                      <>
                        {" · "}
                        <Link href={`/dashboard/propuestas/${c.propuestaId}`} className="hover:text-ink-950 hover:underline">
                          {c.propuestaNombre}
                        </Link>
                      </>
                    )}
                  </p>
                  {c.oportunidadRenovacionId && (
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                      Renovación:
                      <Link href={`/dashboard/oportunidades/${c.oportunidadRenovacionId}`} className="font-medium text-brand-700 hover:underline">
                        {c.oportunidadRenovacionTitulo}
                      </Link>
                      {c.oportunidadRenovacionEtapa && <EtapaBadge etapa={c.oportunidadRenovacionEtapa} />}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {avisar && !oportunidadAbierta && <OportunidadRenovacionButton contratoId={c.id} />}
                  {c.estado === "vigente" && (
                    <button type="button" onClick={() => setRenovando(c)} className={`${avisar ? BUTTON_PRIMARY : BUTTON_SECONDARY} h-9 px-3`}>
                      <RefreshCw className="h-4 w-4" />
                      Renovar
                    </button>
                  )}
                  <button type="button" onClick={() => setEditando(c)} aria-label={`Editar el contrato de ${c.empresaNombre}`} className={`${BUTTON_SECONDARY} h-9 px-3`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {editando && <ContratoDialog key={editando === "nuevo" ? "nuevo" : editando.id} contrato={editando === "nuevo" ? null : editando} esAdmin={esAdmin} onClose={() => setEditando(null)} />}
      {renovando && <RenovarDialog key={renovando.id} contrato={renovando} onClose={() => setRenovando(null)} />}
    </section>
  );
}
