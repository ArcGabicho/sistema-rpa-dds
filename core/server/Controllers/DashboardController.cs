using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(CancellationToken ct)
    {
        var clientsTotal = await db.Clients.CountAsync(ct);
        var clientsNew = await db.Clients.CountAsync(c => c.Status == ClientStatus.Nuevo, ct);

        var recentClients = await db.Clients
            .OrderByDescending(c => c.CreatedAtUtc)
            .Take(5)
            .Select(c => new RecentClientSummary
            {
                Id = c.Id,
                FullName = c.FullName,
                Status = c.Status,
                CreatedAtUtc = c.CreatedAtUtc,
            })
            .ToListAsync(ct);

        return Ok(new DashboardSummaryResponse
        {
            ClientsTotal = clientsTotal,
            ClientsNew = clientsNew,
            RecentClients = recentClients,
        });
    }
}
