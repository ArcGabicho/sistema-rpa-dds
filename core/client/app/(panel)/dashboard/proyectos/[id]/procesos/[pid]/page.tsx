import Link from "next/link";
import { notFound } from "next/navigation";
import { EliminarButton } from "@/components/comercial/eliminar-button";
import { PddEditor } from "@/components/proyecto/pdd-editor";
import { PageHeader } from "@/components/ui/page-header";
import { CARD } from "@/components/ui/panel-styles";
import { EtapaDesarrolloBadge, PddEstadoBadge } from "@/components/ui/proyecto-badges";
import { apiGet } from "@/lib/api";
import { formatNumero } from "@/lib/diagnostico";
import { formatDate } from "@/lib/format-date";
import type { ProcesoProyecto } from "@/lib/proyecto";

export default async function ProcesoProyectoPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  const [proceso, ia] = await Promise.all([
    apiGet<ProcesoProyecto>(`proyectos/procesos/${pid}`),
    apiGet<{ configurada: boolean; modelo: string }>("proyectos/ia"),
  ]);
  if (!proceso || String(proceso.proyectoId) !== id) notFound();

  const volumen =
    proceso.ejecucionesMes !== null
      ? `${formatNumero(proceso.ejecucionesMes)} veces al mes · ${formatNumero(proceso.minutosPorEjecucion ?? 0)} min cada vez · ${proceso.personas} ${proceso.personas === 1 ? "persona" : "personas"}`
      : null;

  return (
    <div>
      <PageHeader
        back={{ href: `/dashboard/proyectos/${proceso.proyectoId}`, label: proceso.proyectoNombre }}
        title={proceso.nombre}
        badges={
          <>
            <EtapaDesarrolloBadge etapa={proceso.etapa} />
            <PddEstadoBadge estado={proceso.pddEstado} version={proceso.pddVersion} />
          </>
        }
        description={
          <>
            <Link href={`/dashboard/empresas/${proceso.empresaId}`} className="font-medium text-ink-950 hover:underline">
              {proceso.empresaNombre}
            </Link>
            {proceso.pddAprobadoPor && proceso.pddAprobadoAtUtc && ` · Aprobado por ${proceso.pddAprobadoPor} el ${formatDate(proceso.pddAprobadoAtUtc)}`}
          </>
        }
        actions={
          <EliminarButton
            path={`proyectos/procesos/${proceso.id}`}
            confirmText={`¿Quitar “${proceso.nombre}” del proyecto con su PDD?`}
            redirectTo={`/dashboard/proyectos/${proceso.proyectoId}`}
            successTitle="Proceso quitado"
          />
        }
      />

      {(volumen || proceso.comoSeHaceHoy) && (
        <section className={`${CARD} mt-6 p-5 text-sm`}>
          <h2 className="text-sm font-semibold text-ink-950">Del diagnóstico</h2>
          {volumen && (
            <p className="mt-1 text-ink-700">
              {volumen}
              {proceso.horasLiberadasMes !== null && ` · libera ${formatNumero(proceso.horasLiberadasMes)} horas al mes`}
            </p>
          )}
          {proceso.comoSeHaceHoy && <p className="mt-1 text-ink-500">{proceso.comoSeHaceHoy}</p>}
        </section>
      )}

      <div className="mt-6">
        <PddEditor proceso={proceso} iaConfigurada={ia?.configurada ?? false} iaModelo={ia?.modelo ?? ""} />
      </div>
    </div>
  );
}
