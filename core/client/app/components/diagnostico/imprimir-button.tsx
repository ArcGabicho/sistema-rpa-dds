"use client";

import { Printer } from "lucide-react";
import { BUTTON_PRIMARY } from "@/components/ui/panel-styles";

export function ImprimirButton() {
  return (
    <button type="button" onClick={() => window.print()} className={`${BUTTON_PRIMARY} print:hidden`}>
      <Printer className="h-4 w-4" />
      Imprimir o guardar PDF
    </button>
  );
}
