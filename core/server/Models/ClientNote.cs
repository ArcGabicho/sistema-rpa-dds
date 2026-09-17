namespace Server.Models;

public class ClientNote
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public Client? Client { get; set; }

    public int AuthorUserId { get; set; }
    public AdminUser? AuthorUser { get; set; }

    public required string Message { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
