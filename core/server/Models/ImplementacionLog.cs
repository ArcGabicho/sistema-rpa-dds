namespace Server.Models;

public static class ImplementacionLogLevel
{
    public const string Info = "info";
    public const string Warning = "warning";
    public const string Error = "error";
}

public class ImplementacionLog
{
    public int Id { get; set; }
    public int ImplementacionId { get; set; }
    public Implementacion? Implementacion { get; set; }
    public required string Level { get; set; }
    public required string Message { get; set; }
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}
