namespace Server.Models;

public static class ImplementacionStatus
{
    public const string Deploying = "deploying";
    public const string Running = "running";
    public const string Paused = "paused";
    public const string Error = "error";
    public const string Deleted = "deleted";
}

public class Implementacion
{
    public int Id { get; set; }
    public required string TemplateId { get; set; }
    public required string Name { get; set; }
    public required string Status { get; set; }

    // Non-secret parameters the user supplied, serialized as JSON. Credentials
    // never live here — they're written straight to Key Vault and only their
    // key names (from the template definition) are needed to look them up again.
    public required string ConfigJson { get; set; }

    // ARM deployment outputs, populated once the deployment finishes.
    public string? OutputsJson { get; set; }
    public string? ErrorMessage { get; set; }

    public required string ResourceGroupName { get; set; }
    public required string DeploymentName { get; set; }

    public int AdminUserId { get; set; }
    public AdminUser? AdminUser { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<ImplementacionLog> Logs { get; set; } = [];
}
