using Server.Models;

namespace Server.Services;

// A proposal's money, in one place (core/client/app/lib/propuesta.ts mirrors
// it for the editor's live totals). Prices are before IGV; the discount
// applies to the one-off part only.
public static class PropuestaCalculo
{
    public const decimal Igv = 0.18m;

    public sealed record Totales(
        decimal SubtotalImplementacion,
        decimal Descuento,
        decimal BaseImplementacion,
        decimal IgvImplementacion,
        decimal TotalImplementacion,
        decimal BaseMensual,
        decimal IgvMensual,
        decimal TotalMensual,
        // One-off plus twelve months, before IGV: what the deal is worth in
        // its first year, and the opportunity's value once it's sent.
        decimal ValorPrimerAnio,
        int Semanas,
        decimal? PaybackMeses,
        decimal? Roi12Meses);

    public static Totales Calcular(Propuesta p)
    {
        decimal Linea(PropuestaItem i) => Math.Round(i.Cantidad * i.PrecioUnitario, 2);

        var subtotal = p.Items.Where(i => i.Tipo == PropuestaItemTipo.Implementacion).Sum(Linea);
        var descuento = Math.Round(subtotal * p.DescuentoPorcentaje / 100m, 2);
        var baseImpl = subtotal - descuento;
        var igvImpl = Math.Round(baseImpl * Igv, 2);
        var baseMensual = p.Items.Where(i => i.Tipo == PropuestaItemTipo.Mensual).Sum(Linea);
        var igvMensual = Math.Round(baseMensual * Igv, 2);

        decimal? payback = null;
        decimal? roi = null;
        if (p.AhorroAnualEstimado is { } ahorroAnual and > 0)
        {
            var (_, r, pb) = Roi.Retorno(ahorroAnual / 12m, baseImpl, baseMensual);
            payback = pb;
            roi = r;
        }

        return new Totales(
            subtotal, descuento, baseImpl, igvImpl, baseImpl + igvImpl,
            baseMensual, igvMensual, baseMensual + igvMensual,
            baseImpl + baseMensual * 12,
            p.Fases.Sum(f => f.Semanas),
            payback, roi);
    }
}
