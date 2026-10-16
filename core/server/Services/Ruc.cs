namespace Server.Services;

// Peruvian RUC (SUNAT tax id): 11 digits, the last one a modulo-11 check digit.
public static class Ruc
{
    private static readonly int[] Weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

    public static bool IsValid(string? ruc)
    {
        if (ruc is null || ruc.Length != 11 || !ruc.All(char.IsAsciiDigit)) return false;
        return ruc[10] - '0' == CheckDigit(ruc[..10]);
    }

    // The check digit for the first 10 digits of a RUC.
    public static int CheckDigit(string first10)
    {
        var sum = 0;
        for (var i = 0; i < 10; i++) sum += (first10[i] - '0') * Weights[i];

        var check = 11 - sum % 11;
        return check switch { 10 => 0, 11 => 1, _ => check };
    }
}
