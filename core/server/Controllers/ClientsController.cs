using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;

namespace Server.Controllers;

[ApiController]
[Route("api/clients")]
public class ClientsController(AppDbContext db, ILogger<ClientsController> logger) : ControllerBase
{
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("contact")]
    public async Task<ActionResult<ClientResponse>> Create(CreateClientRequest request)
    {
        var client = new Client
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = request.Phone.Trim(),
            Service = request.Service,
            Message = request.Message.Trim(),
            Status = ClientStatus.Nuevo,
        };

        db.Clients.Add(client);
        await db.SaveChangesAsync();
        logger.LogInformation("Nueva solicitud de contacto de {Email}", client.Email);

        return CreatedAtAction(nameof(GetById), new { id = client.Id }, ToResponse(client));
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<PagedClientsResponse>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var totalCount = await db.Clients.CountAsync();
        var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling(totalCount / (double)pageSize);

        var clients = await db.Clients
            .Include(c => c.AssignedToUser)
            .OrderByDescending(c => c.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PagedClientsResponse
        {
            Items = clients.Select(ToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
        });
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<ActionResult<ClientResponse>> GetById(int id)
    {
        var client = await db.Clients.Include(c => c.AssignedToUser).FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return NotFound();

        return Ok(ToResponse(client));
    }

    [HttpPatch("{id:int}")]
    [Authorize]
    public async Task<ActionResult<ClientResponse>> Update(int id, UpdateClientRequest request)
    {
        if (!ClientStatus.All.Contains(request.Status))
            return BadRequest(new { message = $"Estado inválido. Usa uno de: {string.Join(", ", ClientStatus.All)}." });

        var client = await db.Clients.Include(c => c.AssignedToUser).FirstOrDefaultAsync(c => c.Id == id);
        if (client is null) return NotFound();

        if (request.AssignedToUserId.HasValue && !await db.AdminUsers.AnyAsync(u => u.Id == request.AssignedToUserId))
            return BadRequest(new { message = "El usuario asignado no existe." });

        client.Status = request.Status;
        client.AssignedToUserId = request.AssignedToUserId;
        await db.SaveChangesAsync();

        // Reload the assignee nav property since it may have just changed.
        await db.Entry(client).Reference(c => c.AssignedToUser).LoadAsync();

        return Ok(ToResponse(client));
    }

    [HttpGet("{id:int}/notes")]
    [Authorize]
    public async Task<ActionResult<List<ClientNoteResponse>>> GetNotes(int id)
    {
        var exists = await db.Clients.AnyAsync(c => c.Id == id);
        if (!exists) return NotFound();

        var notes = await db.ClientNotes
            .Include(n => n.AuthorUser)
            .Where(n => n.ClientId == id)
            .OrderBy(n => n.CreatedAtUtc)
            .ToListAsync();

        return Ok(notes.Select(n => new ClientNoteResponse
        {
            Id = n.Id,
            Message = n.Message,
            AuthorName = n.AuthorUser?.FullName ?? "—",
            CreatedAtUtc = n.CreatedAtUtc,
        }));
    }

    [HttpPost("{id:int}/notes")]
    [Authorize]
    public async Task<ActionResult<ClientNoteResponse>> AddNote(int id, CreateClientNoteRequest request)
    {
        var client = await db.Clients.FindAsync(id);
        if (client is null) return NotFound();

        var authorId = await GetCurrentUserIdAsync();
        if (authorId is null) return Unauthorized();

        var note = new ClientNote
        {
            ClientId = id,
            AuthorUserId = authorId.Value,
            Message = request.Message.Trim(),
        };
        db.ClientNotes.Add(note);
        await db.SaveChangesAsync();

        var author = await db.AdminUsers.FindAsync(authorId.Value);

        return Ok(new ClientNoteResponse
        {
            Id = note.Id,
            Message = note.Message,
            AuthorName = author?.FullName ?? "—",
            CreatedAtUtc = note.CreatedAtUtc,
        });
    }

    private async Task<int?> GetCurrentUserIdAsync()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
        if (email is null) return null;

        var user = await db.AdminUsers.SingleOrDefaultAsync(u => u.Email == email);
        return user?.Id;
    }

    private static ClientResponse ToResponse(Client client) => new()
    {
        Id = client.Id,
        FullName = client.FullName,
        Email = client.Email,
        Phone = client.Phone,
        Service = client.Service,
        Message = client.Message,
        Status = client.Status,
        CreatedAtUtc = client.CreatedAtUtc,
        AssignedToUserId = client.AssignedToUserId,
        AssignedToName = client.AssignedToUser?.FullName,
    };
}
