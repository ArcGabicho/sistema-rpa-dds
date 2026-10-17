import { MiTrabajoPanel, type MiTrabajo } from "@/components/resumen/mi-trabajo";
import { SeccionResumen } from "@/components/resumen/resumen-ui";
import { SeccionComercial, type DashboardSummary } from "@/components/resumen/seccion-comercial";
import { SeccionEntrega, type EntregaResumen } from "@/components/resumen/seccion-entrega";
import { SeccionOperacion } from "@/components/resumen/seccion-operacion";
import { CARD } from "@/components/ui/panel-styles";
import { apiGet } from "@/lib/api";
import { todayInLima } from "@/lib/format-date";
import { relojServidor, type BotsResumen, type IncidenciasResumen, type VencimientoItem } from "@/lib/operacion";
import { puede } from "@/lib/permisos";
import { getMe } from "@/lib/session";

type Seccion = "comercial" | "entrega" | "operacion";

// Each role sees its own area first.
const ORDEN: Record<string, Seccion[]> = {
  Comercial: ["comercial", "entrega", "operacion"],
  Consultor: ["entrega", "comercial", "operacion"],
  Soporte: ["operacion", "entrega", "comercial"],
};

export default async function DashboardPage() {
  const { me } = await getMe();
  const ver = { comercial: puede(me, "comercial"), entrega: puede(me, "proyectos"), operacion: puede(me, "operacion") };
  const [miTrabajo, comercial, entrega, bots, incidencias, vencimientos] = await Promise.all([
    apiGet<MiTrabajo>("dashboard/mi-trabajo"),
    ver.comercial ? apiGet<DashboardSummary>("dashboard/summary") : null,
    ver.entrega ? apiGet<EntregaResumen>("dashboard/entrega") : null,
    ver.operacion ? apiGet<BotsResumen>("bots/resumen") : null,
    ver.operacion ? apiGet<IncidenciasResumen>("incidencias/resumen") : null,
    ver.operacion ? apiGet<VencimientoItem[]>("vencimientos?dias=30") : null,
  ]);
  const today = todayInLima();
  const ahora = relojServidor();
  const orden = (ORDEN[me?.role ?? ""] ?? ["comercial", "entrega", "operacion"]).filter((s) => ver[s]);
  const error = <p className={`${CARD} mt-4 p-6 text-sm text-ink-500`}>No se pudo cargar. Intenta de nuevo más tarde.</p>;

  const secciones: Record<Seccion, React.ReactNode> = {
    comercial: (
      <SeccionResumen key="comercial" titulo="Comercial" href="/dashboard/oportunidades" enlace="Ver el embudo">
        {comercial ? <SeccionComercial data={comercial} today={today} /> : error}
      </SeccionResumen>
    ),
    entrega: (
      <SeccionResumen key="entrega" titulo="Entrega" href="/dashboard/proyectos" enlace="Ver proyectos">
        {entrega ? <SeccionEntrega data={entrega} /> : error}
      </SeccionResumen>
    ),
    operacion: (
      <SeccionResumen key="operacion" titulo="Operación" href="/dashboard/bots" enlace="Ver bots">
        {bots || incidencias ? <SeccionOperacion bots={bots} incidencias={incidencias} vencimientos={vencimientos} /> : error}
      </SeccionResumen>
    ),
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
        Bienvenido{me?.fullName ? `, ${me.fullName}` : ""}
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">Lo que tienes pendiente y cómo van las áreas que ves.</p>

      {miTrabajo && (miTrabajo.tareas || miTrabajo.acciones || miTrabajo.incidencias) && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink-950">Mi trabajo</h2>
          <div className="mt-4">
            <MiTrabajoPanel data={miTrabajo} today={today} ahora={ahora} />
          </div>
        </section>
      )}

      {orden.map((s) => secciones[s])}
    </div>
  );
}
