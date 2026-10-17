namespace Server.Models;

// The panel's modules, each with its own access level per user.
public static class Modulo
{
    // Companies, contacts, opportunities and web requests.
    public const string Comercial = "comercial";
    public const string Diagnosticos = "diagnosticos";
    public const string Propuestas = "propuestas";
    // Projects, their tasks and PDDs.
    public const string Proyectos = "proyectos";
    public const string Boveda = "boveda";
    // Bots, incidents and expirations.
    public const string Operacion = "operacion";

    public static readonly string[] All = [Comercial, Diagnosticos, Propuestas, Proyectos, Boveda, Operacion];

    public static string Label(string modulo) => modulo switch
    {
        Comercial => "Comercial",
        Diagnosticos => "Diagnósticos",
        Propuestas => "Propuestas",
        Proyectos => "Proyectos",
        Boveda => "Bóveda",
        Operacion => "Operación",
        _ => modulo,
    };
}

public static class NivelAcceso
{
    public const string Ninguno = "ninguno";
    public const string Ver = "ver";
    public const string Editar = "editar";

    public static readonly string[] All = [Ninguno, Ver, Editar];

    public static int Rango(string? nivel) => nivel switch
    {
        Editar => 2,
        Ver => 1,
        _ => 0,
    };
}

// One module where a user's access differs from their role's preset.
public class PermisoUsuario
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public AdminUser? Usuario { get; set; }
    public required string Modulo { get; set; }
    public required string Nivel { get; set; }
}
