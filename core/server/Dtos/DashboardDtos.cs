namespace Server.Dtos;

public class RecentClientSummary
{
    public required int Id { get; set; }
    public required string FullName { get; set; }
    public required string Status { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
}

public class RecentImplementacionSummary
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    public required string Status { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
}

public class DashboardSummaryResponse
{
    public required int ClientsTotal { get; set; }
    public required int ClientsNew { get; set; }
    public required int ImplementacionesTotal { get; set; }
    public required int ImplementacionesRunning { get; set; }
    public required int ImplementacionesError { get; set; }
    public required int ImplementacionesDeploying { get; set; }
    public required List<RecentClientSummary> RecentClients { get; set; }
    public required List<RecentImplementacionSummary> RecentImplementaciones { get; set; }
}
