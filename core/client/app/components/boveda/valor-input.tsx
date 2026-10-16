"use client";

import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff, WandSparkles } from "lucide-react";
import { INPUT_BASE, inputState } from "@/components/ui/panel-styles";
import { generarClave } from "@/lib/boveda";

// The secret's value while it's being typed: masked by default, with a
// generator for new passwords and keys. Multi-line values (certificates,
// connection strings, notes) get a textarea.
export function ValorInput({
  id,
  registration,
  multiline,
  hasError,
  describedBy,
  onGenerate,
}: {
  id: string;
  registration: UseFormRegisterReturn;
  multiline: boolean;
  hasError: boolean;
  describedBy?: string;
  onGenerate: (valor: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const common = {
    id,
    autoComplete: "off",
    spellCheck: false,
    "aria-invalid": hasError ? true : undefined,
    "aria-describedby": describedBy,
    ...registration,
  };

  return (
    <div className="flex flex-col gap-2">
      {multiline ? (
        <textarea
          {...common}
          rows={5}
          className={`${INPUT_BASE} ${inputState(hasError)} h-auto resize-y py-2.5 font-mono text-xs`}
        />
      ) : (
        <div className="relative">
          <input
            {...common}
            type={visible ? "text" : "password"}
            className={`${INPUT_BASE} ${inputState(hasError)} pr-10 font-mono`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar valor" : "Mostrar valor"}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-400 hover:text-ink-950"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}
      {!multiline && (
        <button
          type="button"
          onClick={() => {
            onGenerate(generarClave());
            setVisible(true);
          }}
          className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
        >
          <WandSparkles className="h-3.5 w-3.5" />
          Generar una contraseña segura
        </button>
      )}
    </div>
  );
}
