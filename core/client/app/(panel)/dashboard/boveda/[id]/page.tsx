import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { AccesosList } from "@/components/boveda/accesos-list";
import { RevelarSecreto } from "@/components/boveda/revelar-secreto";
import { RotarSecreto } from "@/components/boveda/rotar-secreto";
import { EliminarButton } from "@/components/comercial/eliminar-button";
import { RestringidaBadge, SecretoTipoBadge } from "@/components/ui/boveda-badges";
import { PageHeader } from "@/components/ui/page-header";
import { BUTTON_SECONDARY, CARD } from "@/components/ui/panel-styles";
import { VencimientoBadge } from "@/components/ui/vencimiento-badge";
import { apiGet } from "@/lib/api";
import { SECRETO_TIPO_LABELS, type BovedaResumen, type Secreto } from "@/lib/boveda";
import { formatDate, formatDateTime, todayInLima } from "@/lib/format-date";
import { puede } from "@/lib/permisos";
import { getMe } from "@/lib/session";

export default async function SecretoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [secreto, resumen, { me }] = await Promise.all([apiGet<Secreto>(`boveda/${id}`), apiGet<BovedaResumen>("boveda/resumen"), getMe()]);
  if (!secreto) notFound();

  const admin = me?.esAdmin === true;
  const editar = puede(me, "boveda", "editar");
  const restringidaParaMi = secreto.restringido && !admin;
  const bloqueado = restringidaParaMi
    ? "Credencial restringida: solo un administrador puede verla o cambiarla."
    : resumen && !resumen.configurada
      ? "La bóveda no tiene clave maestra configurada en el servidor, así que no se pueden revelar valores."
      : null;

  const datos: [string, React.ReactNode][] = [
    ["Tipo", SECRETO_TIPO_LABELS[secreto.tipo] ?? secreto.tipo],
    [
      "Empresa",
      secreto.empresaId ? (
        <Link href={`/dashboard/empresas/${secreto.empresaId}`} className="text-brand-700 hover:underline">
          {secreto.empresaNombre}
        </Link>
      ) : (
        "DDS (interna)"
      ),
    ],
    ["Usuario", secreto.usuario && <span className="font-mono text-xs">{secreto.usuario}</span>],
    ["Dónde se usa", secreto.url],
    ["Vencimiento", <VencimientoBadge key="vence" venceEl={secreto.venceEl} today={todayInLima()} />],
    ["Valor cambiado", formatDateTime(secreto.rotadoAtUtc)],
    ["Creada", formatDate(secreto.createdAtUtc)],
  ];

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/boveda", label: "Bóveda" }}
        title={secreto.nombre}
        badges={
          <>
            <SecretoTipoBadge tipo={secreto.tipo} />
            {secreto.restringido && <RestringidaBadge />}
          </>
        }
        description={secreto.empresaNombre ?? "Credencial de DDS"}
        actions={
          <>
            {!restringidaParaMi && editar && (
              <Link href={`/dashboard/boveda/${secreto.id}/editar`} className={BUTTON_SECONDARY}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            )}
            {admin && (
              <EliminarButton
                path={`boveda/${secreto.id}`}
                confirmText={`¿Eliminar “${secreto.nombre}” de la bóveda? El valor se pierde para siempre; el registro de accesos se conserva.`}
                redirectTo="/dashboard/boveda"
                successTitle="Credencial eliminada"
              />
            )}
          </>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <RevelarSecreto id={secreto.id} nombre={secreto.nombre} bloqueado={bloqueado} />

          <section className={`${CARD} p-6`}>
            <h2 className="text-base font-semibold text-ink-950">Historial de accesos</h2>
            <p className="mt-1 text-xs text-ink-500">Los últimos 50 movimientos sobre esta credencial.</p>
            <div className="mt-3 border-t border-line">
              <AccesosList accesos={secreto.accesos.map((a) => ({ ...a, createdAtLabel: formatDateTime(a.createdAtUtc) }))} />
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section className={`${CARD} p-5`}>
            <h2 className="text-base font-semibold text-ink-950">Datos</h2>
            <dl className="mt-3 divide-y divide-line border-t border-line text-sm">
              {datos.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="shrink-0 text-ink-500">{label}</dt>
                  <dd className="min-w-0 text-right break-words text-ink-950">{value || <span className="text-ink-400">—</span>}</dd>
                </div>
              ))}
            </dl>
            {secreto.notas && (
              <>
                <h3 className="mt-4 text-sm font-medium text-ink-950">Notas</h3>
                <p className="mt-1 text-sm whitespace-pre-line text-ink-700">{secreto.notas}</p>
              </>
            )}
          </section>

          {editar && <RotarSecreto id={secreto.id} tipo={secreto.tipo} venceEl={secreto.venceEl} bloqueado={bloqueado !== null} />}
        </div>
      </div>
    </div>
  );
}
