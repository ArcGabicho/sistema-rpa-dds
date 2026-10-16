"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { sileo } from "sileo";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD } from "@/components/ui/panel-styles";
import { panelFetch } from "@/lib/panel-api";

const SEGUNDOS_VISIBLE = 30;

// Outside the component, so the React Compiler doesn't flag Date.now().
function enSegundos(segundos: number) {
  return Date.now() + segundos * 1000;
}

// Shows the value on request, for 30 seconds, then hides it again. Each
// reveal or copy goes through the API, which logs it.
export function RevelarSecreto({
  id,
  nombre,
  bloqueado,
}: {
  id: number;
  nombre: string;
  // Why it can't be revealed (restricted, or the vault has no key), if so.
  bloqueado: string | null;
}) {
  const router = useRouter();
  const [valor, setValor] = useState<string | null>(null);
  const [hasta, setHasta] = useState(0);
  const [restante, setRestante] = useState(0);
  const [cargando, setCargando] = useState<"revelado" | "copiado" | null>(null);

  useEffect(() => {
    if (valor === null) return;
    const timer = setInterval(() => {
      const s = Math.ceil((hasta - Date.now()) / 1000);
      if (s <= 0) {
        setValor(null);
        setRestante(0);
      } else {
        setRestante(s);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [valor, hasta]);

  async function pedir(accion: "revelado" | "copiado") {
    setCargando(accion);
    const result = await panelFetch<{ valor: string }>(`boveda/${id}/revelar`, { method: "POST", body: { accion } });
    setCargando(null);
    if (!result.ok) {
      sileo.error({ title: "No se pudo obtener el valor", description: result.message });
      return null;
    }
    // The access log on this page gains a row.
    router.refresh();
    return result.data.valor;
  }

  async function revelar() {
    const v = await pedir("revelado");
    if (v === null) return;
    setValor(v);
    setHasta(enSegundos(SEGUNDOS_VISIBLE));
    setRestante(SEGUNDOS_VISIBLE);
  }

  async function copiar() {
    // Always through the API, even when it's on screen: copying is logged too.
    const v = await pedir("copiado");
    if (v === null) return;
    try {
      await navigator.clipboard.writeText(v);
      sileo.success({ title: "Copiado al portapapeles", description: nombre });
    } catch {
      sileo.error({ title: "No se pudo copiar", description: "El navegador no permitió usar el portapapeles." });
    }
  }

  return (
    <section className={`${CARD} p-6`}>
      <h2 className="text-base font-semibold text-ink-950">Valor</h2>
      {bloqueado ? (
        <p className="mt-3 flex items-start gap-2.5 rounded-md bg-brand-50 px-3.5 py-3 text-sm text-ink-700">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
          {bloqueado}
        </p>
      ) : (
        <>
          <div
            className={`mt-3 rounded-md border px-3.5 py-3 font-mono text-sm break-all whitespace-pre-wrap ${
              valor === null ? "border-dashed border-line text-ink-400 select-none" : "border-line bg-brand-50 text-ink-950"
            }`}
          >
            {valor ?? "•••••••••••••••••••••"}
          </div>
          {valor !== null && (
            <p className="mt-1.5 text-xs text-ink-500">
              Se ocultará en <span className="font-semibold tabular-nums">{restante}</span> s.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {valor === null ? (
              <button type="button" onClick={revelar} disabled={cargando !== null} className={BUTTON_PRIMARY}>
                {cargando === "revelado" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Revelar
              </button>
            ) : (
              <button type="button" onClick={() => setValor(null)} className={BUTTON_PRIMARY}>
                <EyeOff className="h-4 w-4" />
                Ocultar
              </button>
            )}
            <button type="button" onClick={copiar} disabled={cargando !== null} className={BUTTON_SECONDARY}>
              {cargando === "copiado" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Copiar
            </button>
          </div>
          <p className="mt-4 text-xs text-ink-400">Cada vez que alguien revela o copia este valor queda registrado.</p>
        </>
      )}
    </section>
  );
}
