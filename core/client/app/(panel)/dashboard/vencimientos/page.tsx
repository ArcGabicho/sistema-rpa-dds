import Link from "next/link";
import { BadgeCheck, FileSignature, KeyRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ContratosPanel, OportunidadRenovacionButton } from "@/components/operacion/contratos-panel";
import { LicenciasPanel } from "@/components/operacion/licencias-panel";
import { PlazoBadge } from "@/components/ui/operacion-badges";
import { PageHeader } from "@/components/ui/page-header";
import { CARD } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import type { Paged } from "@/lib/comercial";
import type { BotItem, Contrato, Licencia, VencimientoItem } from "@/lib/operacion";
import { getSessionUser, isAdmin } from "@/lib/session";

const VISTAS = [
  { value: "calendario", label: "Próximos 90 días" },
  { value: "contratos", label: "Contratos de soporte" },
  { value: "licencias", label: "Licencias" },
];

const TIPOS: Record<string, { icon: LucideIcon; label: string }> = {
  contrato: { icon: FileSignature, label: "Contrato" },
  licencia: { icon: BadgeCheck, label: "Licencia" },
  credencial: { icon: KeyRound, label: "Credencial" },
};

function Calendario({ items }: { items: VencimientoItem[] }) {
  const grupos: [string, VencimientoItem[]][] = [
    ["Vencidos", items.filter((i) => i.dias < 0)],
    ["En los próximos 30 días", items.filter((i) => i.dias >= 0 && i.dias <= 30)],
    ["De 31 a 90 días", items.filter((i) => i.dias > 30)],
  ];

  if (items.length === 0) return <p className={`${CARD} p-6 text-sm text-ink-500`}>Nada vence en los próximos 90 días.</p>;

  return (
    <div className="flex flex-col gap-6">
      {grupos
        .filter(([, lista]) => lista.length > 0)
        .map(([titulo, lista]) => (
          <section key={titulo} className={`${CARD} overflow-hidden`}>
            <h2 className="p-5 text-base font-semibold text-ink-950">
              {titulo} <span className="font-normal text-ink-500">{lista.length}</span>
            </h2>
            <ul className="divide-y divide-line border-t border-line">
              {lista.map((i) => {
                const tipo = TIPOS[i.tipo]!;
                const Icon = tipo.icon;
                const href =
                  i.tipo === "credencial" ? `/dashboard/boveda/${i.id}` : i.tipo === "contrato" ? "/dashboard/vencimientos?vista=contratos" : "/dashboard/vencimientos?vista=licencias";
                return (
                  <li key={`${i.tipo}-${i.id}`} className="grid gap-3 px-5 py-3.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="flex min-w-0 gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700" title={tipo.label}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm">
                          <Link href={href} className="font-medium text-ink-950 hover:underline">
                            {i.nombre}
                          </Link>
                          <span className="text-ink-500"> · {tipo.label.toLowerCase()}</span>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-500">
                          {i.empresaId ? (
                            <Link href={`/dashboard/empresas/${i.empresaId}`} className="hover:text-ink-950 hover:underline">
                              {i.empresaNombre}
                            </Link>
                          ) : (
                            "DDS"
                          )}
                          {i.detalle && ` · ${i.detalle}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <PlazoBadge estado={i.estado} dias={i.dias} fecha={i.venceEl} />
                      {i.tipo === "contrato" &&
                        (i.oportunidadRenovacionId ? (
                          <Link href={`/dashboard/oportunidades/${i.oportunidadRenovacionId}`} className="text-xs font-medium text-brand-700 hover:underline">
                            Ver la renovación
                          </Link>
                        ) : (
                          <OportunidadRenovacionButton contratoId={i.id} />
                        ))}
                      {i.tipo === "licencia" && (
                        <Link href="/dashboard/vencimientos?vista=licencias" className="text-xs font-medium text-brand-700 hover:underline">
                          Renovar
                        </Link>
                      )}
                      {i.tipo === "credencial" && (
                        <Link href={`/dashboard/boveda/${i.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                          Rotar en la Bóveda
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
    </div>
  );
}

export default async function VencimientosPage({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const params = await searchParams;
  const vista = VISTAS.some((v) => v.value === params.vista) ? params.vista! : "calendario";
  const user = await getSessionUser();
  const esAdmin = isAdmin(user);

  let contenido: React.ReactNode;
  if (vista === "contratos") {
    const contratos = await apiGet<Contrato[]>("vencimientos/contratos");
    contenido = contratos ? <ContratosPanel contratos={contratos} esAdmin={esAdmin} /> : null;
  } else if (vista === "licencias") {
    const [licencias, bots] = await Promise.all([apiGet<Licencia[]>("vencimientos/licencias"), apiGet<Paged<BotItem>>("bots?pageSize=100")]);
    contenido = licencias ? (
      <LicenciasPanel
        licencias={licencias}
        bots={(bots?.items ?? []).filter((b) => b.estado !== "retirado").map((b) => ({ id: b.id, nombre: b.nombre, empresaId: b.empresaId }))}
        esAdmin={esAdmin}
      />
    ) : null;
  } else {
    const items = await apiGet<VencimientoItem[]>("vencimientos?dias=90");
    contenido = items ? <Calendario items={items} /> : null;
  }

  return (
    <div>
      <PageHeader
        title="Vencimientos"
        description="Contratos de soporte, licencias y credenciales que vencen: renuévalos antes de que un bot se detenga."
      />
      <nav className="mt-6 -mb-px flex gap-1 overflow-x-auto border-b border-line" aria-label="Vista">
        {VISTAS.map((v) => {
          const active = v.value === vista;
          return (
            <Link
              key={v.value}
              href={v.value === "calendario" ? "/dashboard/vencimientos" : `/dashboard/vencimientos?vista=${v.value}`}
              aria-current={active ? "page" : undefined}
              className={`border-b-2 px-3 pb-2.5 text-sm whitespace-nowrap transition-colors ${
                active ? "border-brand-700 font-semibold text-brand-700" : "border-transparent text-ink-500 hover:text-ink-950"
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">{contenido ?? <p className={`${CARD} p-6 text-sm text-ink-500`}>No se pudo cargar. Intenta de nuevo más tarde.</p>}</div>
    </div>
  );
}
