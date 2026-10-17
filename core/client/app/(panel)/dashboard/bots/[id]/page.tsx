import Link from "next/link";
import { notFound } from "next/navigation";
import { LifeBuoy, Pencil } from "lucide-react";
import { AhorroChart, AhorroLeyenda } from "@/components/charts/ahorro-chart";
import { EliminarButton } from "@/components/comercial/eliminar-button";
import { IncidenciasLista } from "@/components/operacion/incidencias-lista";
import { MedicionesPanel } from "@/components/operacion/mediciones-panel";
import { BotEstadoBadge } from "@/components/ui/operacion-badges";
import { PageHeader } from "@/components/ui/page-header";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD } from "@/components/ui/panel-styles";
import { VencimientoBadge } from "@/components/ui/vencimiento-badge";
import { apiGet } from "@/lib/api";
import { SERVICIOS, formatSoles } from "@/lib/comercial";
import { formatNumero, formatPorcentaje } from "@/lib/diagnostico";
import { formatDateTime, formatDay, todayInLima } from "@/lib/format-date";
import { nombreMes, relojServidor, type Bot } from "@/lib/operacion";
import { getSessionUser, isAdmin } from "@/lib/session";

// "YYYY-MM" from the bot's launch month to the current one (or its retirement).
function mesesDesde(desde: string, hasta: string) {
  const meses: string[] = [];
  let [anio, mes] = desde.slice(0, 7).split("-").map(Number) as [number, number];
  const fin = hasta.slice(0, 7);
  for (;;) {
    const actual = `${anio}-${String(mes).padStart(2, "0")}`;
    if (actual > fin) break;
    meses.push(actual);
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }
  return meses;
}

export default async function BotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bot, user] = await Promise.all([apiGet<Bot>(`bots/${id}`), getSessionUser()]);
  if (!bot) notFound();

  const today = todayInLima();
  const ahora = relojServidor();
  const ultimo = bot.ultimo;
  const mes = nombreMes(bot.ultimoMes, false);
  const kpis: [string, string, string][] = [
    [
      `Ahorro de ${mes}`,
      ultimo ? formatSoles(ultimo.ahorroReal) : "—",
      ultimo ? `de ${formatSoles(ultimo.ahorroEstimado)} estimado` : bot.sinRegistro ? "Falta su registro" : "Su primer mes sigue en curso",
    ],
    [
      "Frente al estimado",
      formatPorcentaje(bot.acumulado.cumplimiento),
      bot.acumulado.meses > 0 ? `${formatSoles(bot.acumulado.ahorroReal)} de ${formatSoles(bot.acumulado.ahorroEstimado)} en ${bot.acumulado.meses} ${bot.acumulado.meses === 1 ? "mes" : "meses"}` : "Sin meses registrados",
    ],
    ["Horas liberadas", formatNumero(bot.acumulado.horasAhorradas), "desde que entró en producción"],
    [
      "Incidencias abiertas",
      String(bot.incidenciasAbiertas),
      ultimo?.tasaExito != null ? `${formatPorcentaje(ultimo.tasaExito)} de ejecuciones exitosas en ${mes}` : "—",
    ],
  ];
  const datos: [string, React.ReactNode][] = [
    ["Solución", SERVICIOS.find((s) => s.value === bot.servicio)?.label ?? bot.servicio],
    ["Plataforma", bot.plataforma],
    ["Cuándo corre", bot.horario],
    ["En producción desde", formatDay(bot.enProduccionDesde)],
    ...(bot.retiradoEl ? ([["Retirado el", formatDay(bot.retiradoEl)]] as [string, React.ReactNode][]) : []),
    ["Soporte", bot.responsableNombre ?? "Sin asignar"],
    [
      "Proyecto",
      bot.proyectoId && (
        <Link href={`/dashboard/proyectos/${bot.proyectoId}`} className="text-brand-700 hover:underline">
          {bot.proyectoNombre}
        </Link>
      ),
    ],
  ];
  const estimacion: [string, string][] = [
    ["Horas liberadas al mes", formatNumero(bot.horasMesEstimadas, 1)],
    ["Costo por hora", `S/ ${formatNumero(bot.costoHora, 2)}`],
    ["Minutos por caso a mano", formatNumero(bot.minutosPorCaso, 1)],
    ["Ahorro estimado al mes", formatSoles(bot.ahorroMensualEstimado)],
  ];
  const fechas = Object.fromEntries(bot.incidencias.map((i) => [i.id, formatDateTime(i.createdAtUtc)]));

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/bots", label: "Bots" }}
        title={bot.nombre}
        badges={<BotEstadoBadge estado={bot.estado} conFalla={bot.conFalla} />}
        description={
          <>
            <Link href={`/dashboard/empresas/${bot.empresaId}`} className="font-medium text-ink-950 hover:underline">
              {bot.empresaNombre}
            </Link>
            {bot.plataforma && ` · ${bot.plataforma}`}
            {bot.horario && ` · ${bot.horario}`}
          </>
        }
        actions={
          <>
            <Link href={`/dashboard/incidencias/nueva?botId=${bot.id}`} className={BUTTON_PRIMARY}>
              <LifeBuoy className="h-4 w-4" />
              Reportar incidencia
            </Link>
            <Link href={`/dashboard/bots/${bot.id}/editar`} className={BUTTON_SECONDARY}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
            {isAdmin(user) && (
              <EliminarButton
                path={`bots/${bot.id}`}
                confirmText={`¿Eliminar el bot “${bot.nombre}” con su registro mensual? Sus incidencias y licencias quedan con la empresa. Esta acción no se puede deshacer.`}
                redirectTo="/dashboard/bots"
                successTitle="Bot eliminado"
              />
            )}
          </>
        }
      />

      <dl className={`${CARD} mt-8 grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-4`}>
        {kpis.map(([label, value, detalle]) => (
          <div key={label} className="min-w-0 bg-white p-4 sm:p-5">
            <dt className="text-xs text-ink-500 first-letter:uppercase">{label}</dt>
            <dd className="mt-1.5 truncate font-display text-xl font-semibold tracking-tight text-ink-950">{value}</dd>
            <dd className="mt-0.5 text-xs text-ink-400">{detalle}</dd>
          </div>
        ))}
      </dl>

      {bot.mediciones.length > 0 && (
        <section className={`${CARD} mt-6 flex flex-col p-6`}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-ink-950">Ahorro real frente al estimado</h2>
            <AhorroLeyenda />
          </div>
          <p className="mt-1 text-xs text-ink-500">El primer mes se estima por los días que estuvo en producción.</p>
          <div className="relative mt-4 min-h-60 flex-1">
            <AhorroChart meses={bot.mediciones.map((m) => ({ mes: m.mes, real: m.ahorroReal, estimado: m.ahorroEstimado }))} />
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <MedicionesPanel
            bot={bot}
            mediciones={bot.mediciones}
            meses={mesesDesde(bot.enProduccionDesde, bot.retiradoEl ?? today)}
            pendientes={bot.mesesSinRegistro}
          />

          <section className={`${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 p-5">
              <h2 className="text-base font-semibold text-ink-950">Incidencias</h2>
              <Link href={`/dashboard/incidencias?botId=${bot.id}&estado=todas`} className="text-sm font-medium text-brand-700 hover:underline">
                Ver todas
              </Link>
            </div>
            {bot.incidencias.length === 0 ? (
              <p className="border-t border-line px-5 py-4 text-sm text-ink-500">Sin incidencias.</p>
            ) : (
              <div className="border-t border-line">
                <IncidenciasLista items={bot.incidencias} ahora={ahora} mostrarBot={false} fechas={fechas} />
              </div>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section className={`${CARD} p-5`}>
            <h2 className="text-base font-semibold text-ink-950">Datos</h2>
            {bot.descripcion && <p className="mt-2 text-sm text-ink-700">{bot.descripcion}</p>}
            <dl className="mt-3 divide-y divide-line border-t border-line text-sm">
              {datos.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5">
                  <dt className="shrink-0 text-ink-500">{label}</dt>
                  <dd className="min-w-0 text-right break-words text-ink-950">{value || <span className="text-ink-400">—</span>}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={`${CARD} p-5`}>
            <h2 className="text-base font-semibold text-ink-950">Lo estimado</h2>
            <p className="mt-1 text-xs text-ink-500">Del diagnóstico: contra esto se mide cada mes.</p>
            <dl className="mt-3 divide-y divide-line border-t border-line text-sm">
              {estimacion.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-ink-500">{label}</dt>
                  <dd className="font-medium text-ink-950 tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={`${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 p-5">
              <h2 className="text-base font-semibold text-ink-950">Licencias</h2>
              <Link href="/dashboard/vencimientos?vista=licencias" className="text-sm font-medium text-brand-700 hover:underline">
                Gestionar
              </Link>
            </div>
            {bot.licencias.length === 0 ? (
              <p className="border-t border-line px-5 py-4 text-sm text-ink-500">Ninguna ligada a este bot.</p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {bot.licencias.map((l) => (
                  <li key={l.id} className="flex flex-col gap-1.5 px-5 py-3">
                    <p className="text-sm font-medium text-ink-950">
                      {l.nombre}
                      {l.cantidad > 1 && <span className="font-normal text-ink-500"> · {l.cantidad}</span>}
                    </p>
                    <VencimientoBadge venceEl={l.venceEl} today={today} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
