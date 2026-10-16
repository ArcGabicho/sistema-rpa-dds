"use client";

import { useEffect, useRef, useState } from "react";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT_BASE, inputState } from "@/components/ui/panel-styles";

// Asks why a deal was lost before marking it so: the reasons are what the
// team learns from (price, timing, a competitor…).
export function MotivoPerdidaDialog({
  open,
  titulo,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  titulo?: string;
  onCancel: () => void;
  onConfirm: (motivo: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-lg bg-white p-0 shadow-flyout backdrop:bg-ink-950/40"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!motivo.trim()) return;
          onConfirm(motivo.trim());
          setMotivo("");
        }}
        className="p-6"
      >
        <h2 className="text-base font-semibold text-ink-950">Marcar como perdida</h2>
        {titulo && <p className="mt-1 text-sm text-ink-500">{titulo}</p>}
        <label htmlFor="motivo-perdida" className="mt-5 mb-1.5 block text-sm font-medium text-ink-950">
          ¿Por qué se perdió?
        </label>
        <input
          id="motivo-perdida"
          autoFocus
          value={motivo}
          maxLength={500}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej. Eligió otro proveedor, sin presupuesto este año"
          className={`${INPUT_BASE} ${inputState(false)}`}
        />
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setMotivo("");
              onCancel();
            }}
            className={BUTTON_SECONDARY}
          >
            Cancelar
          </button>
          <button type="submit" disabled={!motivo.trim()} className={BUTTON_PRIMARY}>
            Marcar como perdida
          </button>
        </div>
      </form>
    </dialog>
  );
}
