namespace Server.Models;

public static class ActividadTipo
{
    public const string Nota = "nota";
    public const string Llamada = "llamada";
    public const string Reunion = "reunion";
    public const string Correo = "correo";
    // Logged automatically when an opportunity moves to another stage.
    public const string CambioEtapa = "cambio_etapa";

    public static readonly string[] Manuales = [Nota, Llamada, Reunion, Correo];
}

// Timeline entry on a company, optionally tied to one of its opportunities.
public class Actividad
{
    public int Id { get; set; }
    public int EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }

    public int? OportunidadId { get; set; }
    public Oportunidad? Oportunidad { get; set; }

    public required string Tipo { get; set; }
    public required string Descripcion { get; set; }

    public int AutorId { get; set; }
    public AdminUser? Autor { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
