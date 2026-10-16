import { NuevaPropuestaForm } from "@/components/propuesta/nueva-propuesta-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api";
import type { Empresa, Oportunidad } from "@/lib/comercial";
import type { Diagnostico } from "@/lib/diagnostico";

// ?diagnosticoId= (from a diagnosis), ?oportunidadId= or ?empresaId= preset the client.
export default async function NuevaPropuestaPage({
  searchParams,
}: {
  searchParams: Promise<{ diagnosticoId?: string; oportunidadId?: string; empresaId?: string }>;
}) {
  const { diagnosticoId, oportunidadId, empresaId } = await searchParams;
  const valido = (v?: string) => !!v && /^\d+$/.test(v);
  const [diagnostico, oportunidad, empresa] = await Promise.all([
    valido(diagnosticoId) ? apiGet<Diagnostico>(`diagnosticos/${diagnosticoId}`) : null,
    valido(oportunidadId) ? apiGet<Oportunidad>(`oportunidades/${oportunidadId}`) : null,
    valido(empresaId) ? apiGet<Empresa>(`empresas/${empresaId}`) : null,
  ]);

  return (
    <div>
      <PageHeader
        back={
          diagnostico
            ? { href: `/dashboard/diagnosticos/${diagnostico.id}`, label: diagnostico.titulo }
            : oportunidad
              ? { href: `/dashboard/oportunidades/${oportunidad.id}`, label: oportunidad.titulo }
              : { href: "/dashboard/propuestas", label: "Propuestas" }
        }
        title="Nueva propuesta"
        description={
          diagnostico
            ? "Se arma a partir del diagnóstico: alcance, precios, cronograma y textos quedan precargados para revisar."
            : "Se crea como borrador con el cronograma y los textos base; después agregas el alcance y los precios."
        }
      />
      <div className="mt-8">
        <NuevaPropuestaForm
          diagnostico={diagnostico ?? undefined}
          oportunidad={oportunidad ? { id: oportunidad.id, titulo: oportunidad.titulo, empresaNombre: oportunidad.empresaNombre } : undefined}
          empresa={empresa ? { id: empresa.id, nombreComercial: empresa.nombreComercial, ruc: empresa.ruc } : undefined}
        />
      </div>
    </div>
  );
}
