namespace Server.Models;

public class Client
{
    public int Id { get; set; }
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public required string Service { get; set; }
    public required string Message { get; set; }
    public required string Status { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public int? AssignedToUserId { get; set; }
    public AdminUser? AssignedToUser { get; set; }

    public List<ClientNote> Notes { get; set; } = [];
}
