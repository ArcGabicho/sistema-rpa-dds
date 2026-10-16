import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { MatrizChart } from "@/components/charts/matriz-chart";
import { EliminarButton } from "@/components/comercial/eliminar-button";
import { DiagnosticoAjustes } from "@/components/diagnostico/diagnostico-ajustes";
import { ProcesosTabla } from "@/components/diagnostico/procesos-tabla";
import { TotalesStrip } from "@/components/diagnostico/totales-strip";
import { EtapaBadge } from "@/components/ui/comercial-badges";
import { DiagnosticoEstadoBadge } from "@/components/ui/diagnostico-badges";
import { PageHeader } from "@/components/ui/page-header";
import { BUTTON_SECONDARY, CARD } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import type { TeamUser } from "@/lib/comercial";
import type { Diagnostico } from "@/lib/diagnostico";
import { formatDate } from "@/lib/format-date";
import { getSessionUser, isAdmin } from "@/lib/session";

export default async function DiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [diagnostico, users, user] = await Promise.all([
    apiGet<Diagnostico>(`diagnosticos/${id}`),
    apiGet<TeamUser[]>("users"),
    getSessionUser(),
  ]);
  if (!diagnostico) notFound();

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/diagnosticos", label: "Diagnósticos" }}
        title={diagnostico.titulo}
        badges={<DiagnosticoEstadoBadge estado={diagnostico.estado} />}
        description={
          <>
            <Link href={`/dashboard/empresas/${diagnostico.empresaId}`} className="font-medium text-ink-950 hover:underline">
              {diagnostico.empresaNombre}
            </Link>
            {diagnostico.entregadoAtUtc
              ? ` · Entregado el ${formatDate(diagnostico.entregadoAtUtc)}`
              : ` · Iniciado el ${formatDate(diagnostico.createdAtUtc)}`}
          </>
        }
        actions={
          <>
            <Link href={`/dashboard/diagnosticos/${diagnostico.id}/informe`} className={BUTTON_SECONDARY}>
              <FileText className="h-4 w-4" />
              Ver informe
            </Link>
            {isAdmin(user) && (
              <EliminarButton
                path={`diagnosticos/${diagnostico.id}`}
                confirmText={`¿Eliminar “${diagnostico.titulo}” con sus ${diagnostico.procesos.length} procesos? Esta acción no se puede deshacer.`}
                redirectTo="/dashboard/diagnosticos"
                successTitle="Diagnóstico eliminado"
              />
            )}
          </>
        }
      />

      <div className="mt-8">
        <TotalesStrip totales={diagnostico.totales} />
      </div>

      <div className="mt-6">
        <ProcesosTabla diagnosticoId={diagnostico.id} costoHora={diagnostico.costoHora} procesos={diagnostico.procesos} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className={`${CARD} min-w-0 p-6`}>
          <h2 className="text-base font-semibold text-ink-950">Matriz de priorización</h2>
          {diagnostico.procesos.length > 0 ? (
            <>
              <p className="mt-1 text-sm text-ink-500">Arriba a la derecha, lo que más ahorra y más fácil se automatiza.</p>
              <div className="mt-4">
                <MatrizChart procesos={diagnostico.procesos} />
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-500">Aparecerá al agregar procesos.</p>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          {diagnostico.oportunidadId && (
            <section className={`${CARD} p-5`}>
              <h2 className="text-sm font-semibold text-ink-950">Oportunidad</h2>
              <Link href={`/dashboard/oportunidades/${diagnostico.oportunidadId}`} className="mt-2 block text-sm font-medium text-brand-700 hover:underline">
                {diagnostico.oportunidadTitulo}
              </Link>
              {diagnostico.oportunidadEtapa && (
                <div className="mt-2">
                  <EtapaBadge etapa={diagnostico.oportunidadEtapa} />
                </div>
              )}
            </section>
          )}
          <DiagnosticoAjustes diagnostico={diagnostico} users={users ?? []} />
        </div>
      </div>
    </div>
  );
}
