namespace Server.Models;

// A user's role: a preset of what they can see and change in each module
// (Services/Permisos.cs). An admin can adjust it per user.
public static class AdminRole
{
    public const string Admin = "Admin";
    public const string Comercial = "Comercial";
    public const string Consultor = "Consultor";
    public const string Soporte = "Soporte";

    public static readonly string[] All = [Admin, Comercial, Consultor, Soporte];

    public static string Label(string role) => role switch
    {
        Admin => "Administrador",
        Comercial => "Comercial",
        Consultor => "Consultor",
        Soporte => "Soporte",
        _ => role,
    };
}
