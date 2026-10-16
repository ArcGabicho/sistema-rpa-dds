"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, CopyPlus, FileText, Loader2, Send } from "lucide-react";
import { sileo } from "sileo";
import { MotivoPerdidaDialog } from "@/components/comercial/motivo-perdida-dialog";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/panel-styles";
import { formatMoneda } from "@/lib/propuesta";
import { panelFetch } from "@/lib/panel-api";

// What can be done with the proposal in its current state.
export function PropuestaAcciones({
  id,
  estado,
  esUltima,
  nombre,
  moneda,
  valorPrimerAnio,
  conOportunidad,
}: {
  id: number;
  estado: string;
  esUltima: boolean;
  nombre: string;
  moneda: string;
  valorPrimerAnio: number;
  conOportunidad: boolean;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [rechazando, setRechazando] = useState(false);

  async function accion(path: string, exito: string, body?: unknown) {
    setOcupado(path);
    const result = await panelFetch<{ id?: number }>(`propuestas/${id}/${path}`, { method: "POST", body: body ?? {} });
    setOcupado(null);
    if (!result.ok) {
      sileo.error({ title: "No se pudo completar", description: result.message });
      return null;
    }
    sileo.success({ title: exito });
    return result.data;
  }

  async function enviar() {
    const efecto = conOportunidad
      ? `\n\nLa oportunidad pasará a la etapa Propuesta (si estaba antes) y su valor estimado será ${formatMoneda(valorPrimerAnio, moneda)} (primer año, sin IGV).`
      : "";
    if (!window.confirm(`¿Enviar ${nombre}? Se envía la última versión guardada y ya no se podrá editar.${efecto}`)) return;
    if (await accion("enviar", "Propuesta enviada")) router.refresh();
  }

  async function nuevaVersion() {
    const data = await accion("nueva-version", "Nueva versión creada");
    if (data?.id) router.push(`/dashboard/propuestas/${data.id}`);
  }

  const cargando = (path: string) => (ocupado === path ? <Loader2 className="h-4 w-4 animate-spin" /> : null);

  return (
    <>
      <Link href={`/dashboard/propuestas/${id}/documento`} className={BUTTON_SECONDARY}>
        <FileText className="h-4 w-4" />
        Ver documento
      </Link>
      {estado === "borrador" && (
        <button type="button" onClick={enviar} disabled={ocupado !== null} className={BUTTON_PRIMARY}>
          {cargando("enviar") ?? <Send className="h-4 w-4" />}
          Enviar al cliente
        </button>
      )}
      {estado === "enviada" && (
        <>
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm(`¿El cliente aceptó ${nombre}?${conOportunidad ? " La oportunidad pasará a Ganada." : ""}`)) return;
              if (await accion("aceptar", "¡Propuesta aceptada!")) router.refresh();
            }}
            disabled={ocupado !== null}
            className={BUTTON_PRIMARY}
          >
            {cargando("aceptar") ?? <CircleCheck className="h-4 w-4" />}
            Aceptada
          </button>
          <button type="button" onClick={() => setRechazando(true)} disabled={ocupado !== null} className={BUTTON_SECONDARY}>
            {cargando("rechazar") ?? <CircleX className="h-4 w-4" />}
            Rechazada
          </button>
        </>
      )}
      {esUltima && (estado === "enviada" || estado === "rechazada") && (
        <button type="button" onClick={nuevaVersion} disabled={ocupado !== null} className={BUTTON_SECONDARY}>
          {cargando("nueva-version") ?? <CopyPlus className="h-4 w-4" />}
          Nueva versión
        </button>
      )}

      <MotivoPerdidaDialog
        open={rechazando}
        titulo={nombre}
        encabezado="Propuesta rechazada"
        pregunta="¿Qué dijo el cliente?"
        confirmar="Marcar como rechazada"
        onCancel={() => setRechazando(false)}
        onConfirm={async (motivo) => {
          setRechazando(false);
          if (await accion("rechazar", "Propuesta marcada como rechazada", { motivo })) router.refresh();
        }}
      />
    </>
  );
}
