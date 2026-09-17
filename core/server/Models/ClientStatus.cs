namespace Server.Models;

public static class ClientStatus
{
    public const string Nuevo = "nuevo";
    public const string Contactado = "contactado";
    public const string Cerrado = "cerrado";

    public static readonly string[] All = [Nuevo, Contactado, Cerrado];
}
