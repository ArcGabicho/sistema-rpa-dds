namespace Server.Models;

public class Contacto
{
    public int Id { get; set; }
    public int EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }

    public required string Nombres { get; set; }
    public string? Apellidos { get; set; }
    public string? Cargo { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
