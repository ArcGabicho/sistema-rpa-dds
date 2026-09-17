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

        var implementaciones = db.Implementaciones.Where(i => i.Status != ImplementacionStatus.Deleted);
        var implementacionesTotal = await implementaciones.CountAsync(ct);
        var implementacionesRunning = await implementaciones.CountAsync(i => i.Status == ImplementacionStatus.Running, ct);
        var implementacionesError = await implementaciones.CountAsync(i => i.Status == ImplementacionStatus.Error, ct);
        var implementacionesDeploying = await implementaciones.CountAsync(i => i.Status == ImplementacionStatus.Deploying, ct);

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

        var recentImplementaciones = await implementaciones
            .OrderByDescending(i => i.CreatedAtUtc)
            .Take(5)
            .Select(i => new RecentImplementacionSummary
            {
                Id = i.Id,
                Name = i.Name,
                Status = i.Status,
                CreatedAtUtc = i.CreatedAtUtc,
            })
            .ToListAsync(ct);

        return Ok(new DashboardSummaryResponse
        {
            ClientsTotal = clientsTotal,
            ClientsNew = clientsNew,
            ImplementacionesTotal = implementacionesTotal,
            ImplementacionesRunning = implementacionesRunning,
            ImplementacionesError = implementacionesError,
            ImplementacionesDeploying = implementacionesDeploying,
            RecentClients = recentClients,
            RecentImplementaciones = recentImplementaciones,
        });
    }
}
