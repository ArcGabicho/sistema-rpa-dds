namespace Server.Models;

public static class EmpresaEstado
{
    // Not a client yet: in the prospect base, or contacted but nothing won.
    public const string Prospecto = "prospecto";
    // Has won at least one opportunity.
    public const string Cliente = "cliente";
    public const string Inactiva = "inactiva";

    public static readonly string[] All = [Prospecto, Cliente, Inactiva];
}

public class Empresa
{
    public int Id { get; set; }
    public required string NombreComercial { get; set; }
    public string? RazonSocial { get; set; }
    public string? Ruc { get; set; }
    public string? Rubro { get; set; }
    public string? SitioWeb { get; set; }
    public string? Direccion { get; set; }
    public string? Distrito { get; set; }
    public string? Provincia { get; set; }
    public required string Estado { get; set; }

    // Where the company came from: a trade fair, the prospect base, the web form...
    public string? Origen { get; set; }

    public int? ResponsableId { get; set; }
    public AdminUser? Responsable { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<Contacto> Contactos { get; set; } = [];
    public List<Oportunidad> Oportunidades { get; set; } = [];
}
