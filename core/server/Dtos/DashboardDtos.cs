namespace Server.Dtos;

public class RecentClientSummary
{
    public required int Id { get; set; }
    public required string FullName { get; set; }
    public required string Status { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
}

public class DashboardSummaryResponse
{
    public required int ClientsTotal { get; set; }
    public required int ClientsNew { get; set; }
    public required List<RecentClientSummary> RecentClients { get; set; }
}
