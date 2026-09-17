using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/implementaciones")]
[Authorize]
public class ImplementacionesController(ImplementacionService implementacionService, AppDbContext db) : ControllerBase
{
    [HttpGet("templates")]
    public ActionResult<List<TemplateResponse>> GetTemplates() => Ok(ImplementacionService.GetTemplates());

    [HttpPost]
    public async Task<ActionResult<ImplementacionResponse>> Deploy(DeployImplementacionRequest request, CancellationToken ct)
    {
        var adminUserId = await GetAdminUserIdAsync(ct);
        if (adminUserId is null) return Unauthorized();

        try
        {
            var response = await implementacionService.DeployAsync(request, adminUserId.Value, ct);
            return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
        }
        catch (ImplementacionValidationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<PagedImplementacionesResponse>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        return Ok(await implementacionService.ListAsync(page, pageSize, ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ImplementacionResponse>> GetById(int id, CancellationToken ct)
    {
        var response = await implementacionService.GetByIdAsync(id, ct);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpGet("{id:int}/logs")]
    public async Task<ActionResult<List<ImplementacionLogResponse>>> GetLogs(int id, CancellationToken ct)
    {
        var logs = await implementacionService.GetLogsAsync(id, ct);
        return logs is null ? NotFound() : Ok(logs);
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult<ImplementacionResponse>> UpdateStatus(int id, UpdateImplementacionStatusRequest request, CancellationToken ct)
    {
        var response = await implementacionService.SetPauseResumeAsync(id, request.Action, ct);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AdminRole.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await implementacionService.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }

    private async Task<int?> GetAdminUserIdAsync(CancellationToken ct)
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
        if (email is null) return null;

        var user = await db.AdminUsers.SingleOrDefaultAsync(u => u.Email == email, ct);
        return user?.Id;
    }
}
