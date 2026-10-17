"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Hourglass, Loader2, PlayCircle, RotateCcw } from "lucide-react";
import { sileo } from "sileo";
import { Field } from "@/components/ui/field";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { CAUSAS } from "@/lib/operacion";
import { panelFetch } from "@/lib/panel-api";

// Resolving asks why it happened and what was done: the cause feeds the
// summary of causes, the solution stays on the incident.
function ResolverDialog({ causaInicial, onClose, onConfirm }: { causaInicial: string | null; onClose: () => void; onConfirm: (causa: string, solucion: string) => Promise<void> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [causa, setCausa] = useState(causaInicial ?? "");
  const [solucion, setSolucion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const input = `${INPUT_BASE} ${inputState(false)}`;

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-lg bg-white p-0 shadow-flyout backdrop:bg-ink-950/40"
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!causa || !solucion.trim()) return;
          setEnviando(true);
          await onConfirm(causa, solucion.trim());
          setEnviando(false);
        }}
        className="flex flex-col gap-4 p-6"
      >
        <h2 className="text-base font-semibold text-ink-950">Resolver la incidencia</h2>
        <Field id="res-causa" label="Causa">
          <select id="res-causa" value={causa} onChange={(e) => setCausa(e.target.value)} className={input}>
            <option value="" disabled>
              ¿Por qué pasó?
            </option>
            {CAUSAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="res-solucion" label="Solución">
          <textarea
            id="res-solucion"
            autoFocus
            rows={4}
            maxLength={4000}
            value={solucion}
            onChange={(e) => setSolucion(e.target.value)}
            placeholder="Qué se hizo y cómo se verificó; si se reprocesaron casos."
            className={`${input} h-auto resize-y py-2.5`}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
            Cancelar
          </button>
          <button type="submit" disabled={enviando || !causa || !solucion.trim()} className={BUTTON_PRIMARY}>
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            Resolver
          </button>
        </div>
      </form>
    </dialog>
  );
}

// The next steps for the incident's state: take it, wait on the client
// (the SLA clock stops), resolve it, or reopen it.
export function IncidenciaAcciones({ id, estado, causa }: { id: number; estado: string; causa: string | null }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState<string | null>(null);
  const [resolviendo, setResolviendo] = useState(false);

  async function cambiar(nuevo: string, extra: { causa?: string; solucion?: string } = {}) {
    setEnviando(nuevo);
    const result = await panelFetch(`incidencias/${id}/estado`, { method: "POST", body: { estado: nuevo, ...extra } });
    setEnviando(null);
    if (!result.ok) {
      sileo.error({ title: "No se pudo cambiar el estado", description: result.message });
      return false;
    }
    router.refresh();
    return true;
  }

  const boton = (nuevo: string, texto: string, Icono: typeof PlayCircle, primario = false) => (
    <button type="button" onClick={() => cambiar(nuevo)} disabled={enviando !== null} className={primario ? BUTTON_PRIMARY : BUTTON_SECONDARY}>
      {enviando === nuevo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icono className="h-4 w-4" />}
      {texto}
    </button>
  );

  return (
    <>
      {estado === "abierta" && boton("en_atencion", "Tomar la incidencia", PlayCircle, true)}
      {estado === "en_atencion" && boton("esperando_cliente", "Esperar al cliente", Hourglass)}
      {estado === "esperando_cliente" && boton("en_atencion", "Retomar", PlayCircle)}
      {estado !== "resuelta" ? (
        <button type="button" onClick={() => setResolviendo(true)} disabled={enviando !== null} className={estado === "abierta" ? BUTTON_SECONDARY : BUTTON_PRIMARY}>
          <CheckCircle2 className="h-4 w-4" />
          Resolver
        </button>
      ) : (
        boton("en_atencion", "Reabrir", RotateCcw)
      )}
      {resolviendo && (
        <ResolverDialog
          causaInicial={causa}
          onClose={() => setResolviendo(false)}
          onConfirm={async (c, solucion) => {
            if (await cambiar("resuelta", { causa: c, solucion })) {
              setResolviendo(false);
              sileo.success({ title: "Incidencia resuelta" });
            }
          }}
        />
      )}
    </>
  );
}
