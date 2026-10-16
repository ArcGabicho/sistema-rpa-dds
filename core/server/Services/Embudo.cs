using Server.Data;
using Server.Models;

namespace Server.Services;

// Moving an opportunity through the pipeline, shared by the opportunities
// API and the modules that advance it (a diagnosis starting, say): the move
// is logged on its timeline, the loss reason kept only for lost deals, the
// close date set or cleared, and a win makes the company a client.
public static class Embudo
{
    public static async Task CambiarEtapaAsync(
        AppDbContext db, Oportunidad oportunidad, string etapa, string? motivoPerdida, int? autorId, CancellationToken ct)
    {
        oportunidad.MotivoPerdida = etapa == OportunidadEtapa.Perdida ? Normalize(motivoPerdida) : null;
        if (oportunidad.Etapa == etapa) return;

        oportunidad.CerradaAtUtc = OportunidadEtapa.Abiertas.Contains(etapa) ? null : DateTime.UtcNow;

        var descripcion = $"Etapa: {OportunidadEtapa.Label(oportunidad.Etapa)} → {OportunidadEtapa.Label(etapa)}.";
        if (oportunidad.MotivoPerdida is not null) descripcion += $" Motivo: {oportunidad.MotivoPerdida}";

        oportunidad.Etapa = etapa;
        oportunidad.UpdatedAtUtc = DateTime.UtcNow;
        db.Actividades.Add(new Actividad
        {
            EmpresaId = oportunidad.EmpresaId,
            OportunidadId = oportunidad.Id,
            Tipo = ActividadTipo.CambioEtapa,
            Descripcion = descripcion,
            AutorId = autorId,
        });
        await MarcarClienteSiGanadaAsync(db, oportunidad, ct);
    }

    public static async Task MarcarClienteSiGanadaAsync(AppDbContext db, Oportunidad oportunidad, CancellationToken ct)
    {
        if (oportunidad.Etapa != OportunidadEtapa.Ganada) return;

        var empresa = await db.Empresas.FindAsync([oportunidad.EmpresaId], ct);
        if (empresa is not null && empresa.Estado != EmpresaEstado.Cliente)
        {
            empresa.Estado = EmpresaEstado.Cliente;
            empresa.UpdatedAtUtc = DateTime.UtcNow;
        }
    }

    // A note on the opportunity's timeline, from another module.
    public static void Anotar(AppDbContext db, Oportunidad oportunidad, string descripcion, int? autorId)
    {
        db.Actividades.Add(new Actividad
        {
            EmpresaId = oportunidad.EmpresaId,
            OportunidadId = oportunidad.Id,
            Tipo = ActividadTipo.Nota,
            Descripcion = descripcion,
            AutorId = autorId,
        });
        oportunidad.UpdatedAtUtc = DateTime.UtcNow;
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
