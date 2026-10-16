"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { sileo } from "sileo";
import { BUTTON_DANGER } from "@/components/ui/panel-styles";
import { panelFetch } from "@/lib/panel-api";

// Admin-only removal of a record, then back to its list.
export function EliminarButton({
  path,
  confirmText,
  redirectTo,
  successTitle,
}: {
  path: string;
  confirmText: string;
  redirectTo: string;
  successTitle: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmText)) return;
    setDeleting(true);
    const result = await panelFetch(path, { method: "DELETE" });
    if (!result.ok) {
      setDeleting(false);
      sileo.error({ title: "No se pudo eliminar", description: result.message });
      return;
    }
    sileo.success({ title: successTitle });
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button type="button" onClick={handleClick} disabled={deleting} className={BUTTON_DANGER}>
      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Eliminar
    </button>
  );
}
