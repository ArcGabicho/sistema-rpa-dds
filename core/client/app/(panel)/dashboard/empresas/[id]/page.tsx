import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { EmpresaCredenciales } from "@/components/boveda/empresa-credenciales";
import { ActividadTimeline } from "@/components/comercial/actividad-timeline";
import { ContactosPanel } from "@/components/comercial/contactos-panel";
import { EliminarButton } from "@/components/comercial/eliminar-button";
import { EmpresaOperacion } from "@/components/operacion/empresa-operacion";
import { ProximaAccionLabel } from "@/components/comercial/proxima-accion-label";
import { EmpresaEstadoBadge, EtapaBadge } from "@/components/ui/comercial-badges";
import { PageHeader } from "@/components/ui/page-header";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import type { SecretoItem } from "@/lib/boveda";
import { ETAPAS_ABIERTAS, formatSoles, type Empresa, type Paged } from "@/lib/comercial";
import { formatDate, formatDateTime, todayInLima } from "@/lib/format-date";
import type { BotItem, Contrato, IncidenciaItem } from "@/lib/operacion";
import { getSessionUser, isAdmin } from "@/lib/session";

function website(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default async function EmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numerico = /^\d+$/.test(id);
  const [empresa, user, credenciales, bots, contratos, incidencias] = await Promise.all([
    apiGet<Empresa>(`empresas/${id}`),
    getSessionUser(),
    numerico ? apiGet<Paged<SecretoItem>>(`boveda?empresaId=${id}&pageSize=50`) : null,
    numerico ? apiGet<Paged<BotItem>>(`bots?empresaId=${id}&pageSize=50`) : null,
    numerico ? apiGet<Contrato[]>(`vencimientos/contratos?empresaId=${id}`) : null,
    numerico ? apiGet<Paged<IncidenciaItem>>(`incidencias?empresaId=${id}&estado=abiertas&pageSize=1`) : null,
  ]);
  if (!empresa) notFound();

  const today = todayInLima();
  const ubicacion = [empresa.direccion, empresa.distrito, empresa.provincia].filter(Boolean).join(", ");
  const datos: [string, React.ReactNode][] = [
    ["Razón social", empresa.razonSocial],
    ["RUC", empresa.ruc && <span className="font-mono">{empresa.ruc}</span>],
    ["Rubro", empresa.rubro],
    [
      "Sitio web",
      empresa.sitioWeb && (
        <a
          href={website(empresa.sitioWeb)}
          target="_blank"
          rel="noopener noreferrer"
          title={empresa.sitioWeb}
          className="block truncate text-brand-700 hover:underline"
        >
          {empresa.sitioWeb.replace(/^https?:\/\//i, "")}
        </a>
      ),
    ],
    ["Ubicación", ubicacion || null],
    ["Origen", empresa.origen],
    ["Responsable", empresa.responsableNombre ?? "Sin asignar"],
    ["Registrada", formatDate(empresa.createdAtUtc)],
  ];

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/empresas", label: "Empresas" }}
        title={empresa.nombreComercial}
        badges={<EmpresaEstadoBadge estado={empresa.estado} />}
        description={[empresa.rubro, empresa.provincia].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <Link href={`/dashboard/oportunidades/nueva?empresaId=${empresa.id}`} className={BUTTON_PRIMARY}>
              <Plus className="h-4 w-4" />
              Nueva oportunidad
            </Link>
            <Link href={`/dashboard/empresas/${empresa.id}/editar`} className={BUTTON_SECONDARY}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
            {isAdmin(user) && (
              <EliminarButton
                path={`empresas/${empresa.id}`}
                confirmText={`¿Eliminar ${empresa.nombreComercial} con sus contactos, oportunidades e historial? Esta acción no se puede deshacer.`}
                redirectTo="/dashboard/empresas"
                successTitle="Empresa eliminada"
              />
            )}
          </>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className={`${CARD} overflow-hidden`}>
            <h2 className="p-5 text-base font-semibold text-ink-950">
              Oportunidades <span className="font-normal text-ink-500">{empresa.oportunidades.length}</span>
            </h2>
            {empresa.oportunidades.length === 0 ? (
              <p className="border-t border-line px-5 py-4 text-sm text-ink-500">
                Aún no hay oportunidades con esta empresa.
              </p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {empresa.oportunidades.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/dashboard/oportunidades/${o.id}`}
                      className="group flex flex-col gap-2 px-5 py-3.5 transition-colors hover:bg-brand-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink-950 group-hover:underline">{o.titulo}</p>
                        {ETAPAS_ABIERTAS.includes(o.etapa) && (
                          <div className="mt-1">
                            <ProximaAccionLabel accion={o.proximaAccion} fecha={o.proximaAccionFecha} today={today} />
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-semibold text-ink-950">{formatSoles(o.valorEstimado)}</span>
                        <EtapaBadge etapa={o.etapa} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ActividadTimeline
            endpoint={`empresas/${empresa.id}/actividades`}
            actividades={empresa.actividades.map((a) => ({ ...a, createdAtLabel: formatDateTime(a.createdAtUtc) }))}
            showOportunidad
          />
        </div>

        <div className="flex flex-col gap-6">
          <section className={`${CARD} p-5`}>
            <h2 className="text-base font-semibold text-ink-950">Datos</h2>
            <dl className="mt-3 divide-y divide-line border-t border-line text-sm">
              {datos.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5">
                  <dt className="shrink-0 text-ink-500">{label}</dt>
                  <dd className="min-w-0 text-right break-words text-ink-950">{value || <span className="text-ink-400">—</span>}</dd>
                </div>
              ))}
            </dl>
          </section>

          <EmpresaOperacion
            empresaId={empresa.id}
            bots={bots?.items ?? []}
            contratos={contratos ?? []}
            incidenciasAbiertas={incidencias?.totalCount ?? 0}
          />

          <ContactosPanel empresaId={empresa.id} contactos={empresa.contactos} />

          <EmpresaCredenciales
            empresaId={empresa.id}
            secretos={credenciales?.items ?? null}
            today={today}
            esAdmin={isAdmin(user)}
          />
        </div>
      </div>
    </div>
  );
}
