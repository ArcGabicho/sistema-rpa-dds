"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, RefreshCw, X } from "lucide-react";
import { sileo } from "sileo";
import { EmpresaPicker, type EmpresaOption } from "@/components/comercial/empresa-picker";
import { Field } from "@/components/ui/field";
import { PlazoBadge } from "@/components/ui/operacion-badges";
import { BUTTON_DANGER, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { formatDay } from "@/lib/format-date";
import type { Licencia } from "@/lib/operacion";
import { formatMoneda } from "@/lib/propuesta";
import { panelFetch } from "@/lib/panel-api";

type BotOpcion = { id: number; nombre: string; empresaId: number };

const DIALOG = "m-auto max-h-[92dvh] w-[min(34rem,calc(100%-1.5rem))] overflow-hidden rounded-lg bg-white p-0 shadow-flyout backdrop:bg-ink-950/40";

// "YYYY-MM-DD" one year after another, for the renewal's default.
function unAnioDespues(fecha: string) {
  const [anio, resto] = [Number(fecha.slice(0, 4)), fecha.slice(4, 10)];
  return `${anio + 1}${resto}`;
}

function LicenciaDialog({ licencia, bots, esAdmin, onClose }: { licencia: Licencia | null; bots: BotOpcion[]; esAdmin: boolean; onClose: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [deDds, setDeDds] = useState(licencia ? licencia.empresaId === null : false);
  const [empresa, setEmpresa] = useState<EmpresaOption | null>(
    licencia?.empresaId ? { id: licencia.empresaId, nombreComercial: licencia.empresaNombre ?? "", ruc: null } : null,
  );
  const [form, setForm] = useState({
    nombre: licencia?.nombre ?? "",
    proveedor: licencia?.proveedor ?? "",
    cantidad: licencia?.cantidad.toString() ?? "1",
    costoAnual: licencia?.costoAnual?.toString() ?? "",
    moneda: licencia?.moneda ?? "USD",
    pagaCliente: licencia ? licencia.pagaCliente : true,
    venceEl: licencia?.venceEl.slice(0, 10) ?? "",
    botId: licencia?.botId?.toString() ?? "",
    notas: licencia?.notas ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const set = (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const input = `${INPUT_BASE} ${inputState(false)}`;
  const botsEmpresa = empresa && !deDds ? bots.filter((b) => b.empresaId === empresa.id) : [];

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (form.nombre.trim().length < 2 || !form.venceEl || (!deDds && !empresa)) {
      sileo.error({ title: "Faltan datos", description: "La licencia necesita nombre, de quién es y cuándo vence." });
      return;
    }
    setGuardando(true);
    const body = {
      empresaId: deDds ? null : empresa!.id,
      botId: !deDds && form.botId ? Number(form.botId) : null,
      nombre: form.nombre.trim(),
      proveedor: form.proveedor.trim() || null,
      cantidad: Number(form.cantidad) || 1,
      costoAnual: form.costoAnual === "" ? null : Number(form.costoAnual),
      moneda: form.moneda,
      pagaCliente: deDds ? false : form.pagaCliente,
      venceEl: form.venceEl,
      notas: form.notas.trim() || null,
    };
    const result = licencia
      ? await panelFetch(`vencimientos/licencias/${licencia.id}`, { method: "PUT", body })
      : await panelFetch("vencimientos/licencias", { method: "POST", body });
    setGuardando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo guardar la licencia", description: result.message });
      return;
    }
    sileo.success({ title: licencia ? "Licencia actualizada" : "Licencia registrada" });
    onClose();
    router.refresh();
  }

  async function eliminar() {
    if (!licencia || !window.confirm(`¿Eliminar la licencia “${licencia.nombre}”? Esta acción no se puede deshacer.`)) return;
    const result = await panelFetch(`vencimientos/licencias/${licencia.id}`, { method: "DELETE" });
    if (!result.ok) {
      sileo.error({ title: "No se pudo eliminar", description: result.message });
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={DIALOG}
    >
      <form onSubmit={guardar} className="flex max-h-[92dvh] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="text-base font-semibold text-ink-950">{licencia ? "Editar licencia" : "Nueva licencia"}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-md p-1.5 text-ink-500 hover:bg-brand-50 hover:text-ink-950">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-ink-950 sm:col-span-2">
            <input type="checkbox" checked={deDds} onChange={(e) => setDeDds(e.target.checked)} className="accent-brand-700" />
            Es de DDS (no de un cliente)
          </label>
          {!deDds && (
            <>
              <Field id="lc-empresa" label="Cliente" className="sm:col-span-2">
                <EmpresaPicker
                  id="lc-empresa"
                  value={empresa}
                  onChange={(e) => {
                    setEmpresa(e);
                    setForm((f) => ({ ...f, botId: "" }));
                  }}
                />
              </Field>
              <Field id="lc-bot" label="Bot" optional hint="Si la usa un solo bot." className="sm:col-span-2">
                <select id="lc-bot" value={form.botId} onChange={set("botId")} disabled={botsEmpresa.length === 0} className={input}>
                  <option value="">{botsEmpresa.length === 0 ? "La empresa no tiene bots" : "Compartida o sin bot"}</option>
                  {botsEmpresa.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
          <Field id="lc-nombre" label="Licencia" className="sm:col-span-2">
            <input id="lc-nombre" value={form.nombre} maxLength={200} onChange={set("nombre")} placeholder="Ej. UiPath Unattended Robot" className={input} />
          </Field>
          <Field id="lc-proveedor" label="Proveedor" optional>
            <input id="lc-proveedor" value={form.proveedor} maxLength={100} onChange={set("proveedor")} placeholder="Ej. UiPath" className={input} />
          </Field>
          <Field id="lc-cantidad" label="Cantidad">
            <input id="lc-cantidad" type="number" min={1} value={form.cantidad} onChange={set("cantidad")} className={input} />
          </Field>
          <Field id="lc-costo" label="Costo anual" optional>
            <input id="lc-costo" type="number" min={0} step="any" value={form.costoAnual} onChange={set("costoAnual")} className={input} />
          </Field>
          <Field id="lc-moneda" label="Moneda">
            <select id="lc-moneda" value={form.moneda} onChange={set("moneda")} className={input}>
              <option value="USD">Dólares (US$)</option>
              <option value="PEN">Soles (S/)</option>
            </select>
          </Field>
          <Field id="lc-vence" label="Vence el">
            <input id="lc-vence" type="date" value={form.venceEl} onChange={set("venceEl")} className={input} />
          </Field>
          {!deDds && (
            <Field id="lc-paga" label="La paga">
              <select id="lc-paga" value={form.pagaCliente ? "cliente" : "dds"} onChange={(e) => setForm((f) => ({ ...f, pagaCliente: e.target.value === "cliente" }))} className={input}>
                <option value="cliente">El cliente</option>
                <option value="dds">DDS (incluida en el soporte)</option>
              </select>
            </Field>
          )}
          <Field id="lc-notas" label="Notas" optional className="sm:col-span-2">
            <input id="lc-notas" value={form.notas} maxLength={1000} onChange={set("notas")} className={input} />
          </Field>
        </div>
        <footer className="flex items-center justify-between gap-2 border-t border-line px-6 py-4">
          {licencia && esAdmin ? (
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

function RenovarLicenciaDialog({ licencia, onClose }: { licencia: Licencia; onClose: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [venceEl, setVenceEl] = useState(unAnioDespues(licencia.venceEl));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  async function renovar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const result = await panelFetch(`vencimientos/licencias/${licencia.id}/renovar`, { method: "POST", body: { venceEl } });
    setGuardando(false);
    if (!result.ok) {
      sileo.error({ title: "No se pudo renovar", description: result.message });
      return;
    }
    sileo.success({ title: "Licencia renovada", description: `Vence el ${formatDay(venceEl)}.` });
    onClose();
    router.refresh();
  }

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={DIALOG}
    >
      <form onSubmit={renovar} className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-base font-semibold text-ink-950">Renovar licencia</h2>
          <p className="mt-1 text-sm text-ink-500">
            {licencia.nombre} · vence el {formatDay(licencia.venceEl)}.
          </p>
        </div>
        <Field id="rl-vence" label="Nuevo vencimiento">
          <input id="rl-vence" type="date" value={venceEl} onChange={(e) => setVenceEl(e.target.value)} className={`${INPUT_BASE} ${inputState(false)}`} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando || venceEl <= licencia.venceEl.slice(0, 10)} className={BUTTON_PRIMARY}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            Renovar
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function LicenciasPanel({ licencias, bots, esAdmin }: { licencias: Licencia[]; bots: BotOpcion[]; esAdmin: boolean }) {
  const [editando, setEditando] = useState<Licencia | null | "nueva">(null);
  const [renovando, setRenovando] = useState<Licencia | null>(null);

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-base font-semibold text-ink-950">
            Licencias <span className="font-normal text-ink-500">{licencias.length}</span>
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">De las plataformas de los bots, de los clientes y de DDS. Avisan 30 días antes.</p>
        </div>
        <button type="button" onClick={() => setEditando("nueva")} className={`${BUTTON_SECONDARY} h-9 shrink-0 px-3`}>
          <Plus className="h-4 w-4" />
          Licencia
        </button>
      </div>
      {licencias.length === 0 ? (
        <p className="border-t border-line px-5 py-4 text-sm text-ink-500">Aún no hay licencias registradas.</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {licencias.map((l) => (
            <li key={l.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink-950">
                    {l.nombre}
                    {l.cantidad > 1 && <span className="font-normal text-ink-500"> · {l.cantidad}</span>}
                  </p>
                  <PlazoBadge estado={l.vencimiento} dias={l.dias} fecha={l.venceEl} />
                </div>
                <p className="mt-0.5 text-xs text-ink-500">
                  {l.empresaId ? (
                    <Link href={`/dashboard/empresas/${l.empresaId}`} className="hover:text-ink-950 hover:underline">
                      {l.empresaNombre}
                    </Link>
                  ) : (
                    "DDS"
                  )}
                  {l.botId && (
                    <>
                      {" · "}
                      <Link href={`/dashboard/bots/${l.botId}`} className="hover:text-ink-950 hover:underline">
                        {l.botNombre}
                      </Link>
                    </>
                  )}
                  {l.proveedor && ` · ${l.proveedor}`}
                  {l.costoAnual !== null && ` · ${formatMoneda(l.costoAnual, l.moneda)} al año`}
                  {` · la paga ${l.pagaCliente ? "el cliente" : "DDS"}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button type="button" onClick={() => setRenovando(l)} className={`${l.vencimiento === "vigente" ? BUTTON_SECONDARY : BUTTON_PRIMARY} h-9 px-3`}>
                  <RefreshCw className="h-4 w-4" />
                  Renovar
                </button>
                <button type="button" onClick={() => setEditando(l)} aria-label={`Editar la licencia ${l.nombre}`} className={`${BUTTON_SECONDARY} h-9 px-3`}>
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editando && <LicenciaDialog key={editando === "nueva" ? "nueva" : editando.id} licencia={editando === "nueva" ? null : editando} bots={bots} esAdmin={esAdmin} onClose={() => setEditando(null)} />}
      {renovando && <RenovarLicenciaDialog key={renovando.id} licencia={renovando} onClose={() => setRenovando(null)} />}
    </section>
  );
}
