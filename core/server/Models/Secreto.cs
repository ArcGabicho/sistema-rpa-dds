namespace Server.Models;

public static class SecretoTipo
{
    public const string Credencial = "credencial";
    public const string ApiKey = "api_key";
    public const string Token = "token";
    public const string Conexion = "conexion";
    public const string Certificado = "certificado";
    public const string Nota = "nota";

    public static readonly string[] All = [Credencial, ApiKey, Token, Conexion, Certificado, Nota];
}

public static class SecretoAccion
{
    public const string Creado = "creado";
    public const string Revelado = "revelado";
    public const string Copiado = "copiado";
    public const string Editado = "editado";
    public const string Rotado = "rotado";
    public const string Eliminado = "eliminado";
}

// A credential, API key or token kept in the vault: a client's (EmpresaId)
// or DDS's own (no company). Only the value is secret, and it's stored
// encrypted (see Services/BovedaCifrado); the rest is metadata the team can
// browse without revealing anything.
public class Secreto
{
    public int Id { get; set; }

    // Bound into the ciphertext as associated data, so an encrypted value
    // can't be moved to another row and decrypt there.
    public Guid Uid { get; set; } = Guid.NewGuid();

    public required string Nombre { get; set; }
    public required string Tipo { get; set; }

    public int? EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }

    // The login the credential goes with, and where it's used. Not secret.
    public string? Usuario { get; set; }
    public string? Url { get; set; }
    public string? Notas { get; set; }

    public required byte[] ValorCifrado { get; set; }

    // Only admins can reveal it.
    public bool Restringido { get; set; }

    // When the key or password expires (date only), for rotation reminders.
    public DateTime? VenceEl { get; set; }
    public DateTime RotadoAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<AccesoSecreto> Accesos { get; set; } = [];
}

// Audit trail of the vault: who created, revealed, copied, edited, rotated or
// deleted what, when and from where. Names are copied in so the record
// survives deleting the secret or the user.
public class AccesoSecreto
{
    public long Id { get; set; }

    public int? SecretoId { get; set; }
    public Secreto? Secreto { get; set; }
    public required string SecretoNombre { get; set; }

    public int? UsuarioId { get; set; }
    public AdminUser? Usuario { get; set; }
    public required string UsuarioNombre { get; set; }

    public required string Accion { get; set; }
    public string? Ip { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
