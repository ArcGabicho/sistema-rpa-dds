using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/clients")]
[Modulo(Modulo.Comercial)]
public class ClientsController(AppDbContext db, ILogger<ClientsController> logger) : ControllerBase
{
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimiting.Contact)]
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

        return CreatedAtAction(nameof(GetById), new { id = client.Id }, ToResponse(client, null));
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

        var ids = clients.Select(c => c.Id).ToList();
        var convertidas = await db.Oportunidades
            .Where(o => o.SolicitudId != null && ids.Contains(o.SolicitudId.Value))
            .ToDictionaryAsync(o => o.SolicitudId!.Value, o => o.Id);

        return Ok(new PagedClientsResponse
        {
            Items = clients.Select(c => ToResponse(c, convertidas.TryGetValue(c.Id, out var oportunidadId) ? oportunidadId : null)).ToList(),
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

        return Ok(ToResponse(client, await FindOportunidadIdAsync(id)));
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

        return Ok(ToResponse(client, await FindOportunidadIdAsync(id)));
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
            AuthorName = n.AuthorUser?.FullName ?? "Usuario eliminado",
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

    // Turns a web contact-form request into the commercial pipeline: reuses or
    // creates the company, adds the requester as a contact and opens an
    // opportunity whose timeline starts with the original message.
    [HttpPost("{id:int}/convertir")]
    [Authorize]
    public async Task<IActionResult> Convertir(int id, ConvertirSolicitudRequest request, CancellationToken ct)
    {
        var client = await db.Clients.FindAsync([id], ct);
        if (client is null) return NotFound();

        var existente = await FindOportunidadIdAsync(id);
        if (existente is not null)
            return Conflict(new { message = "Esta solicitud ya se convirtió en una oportunidad.", oportunidadId = existente });

        var autorId = await db.GetCurrentUserIdAsync(User, ct);
        if (autorId is null) return Unauthorized();

        Empresa? empresa;
        if (request.EmpresaId is int empresaId)
        {
            empresa = await db.Empresas.FindAsync([empresaId], ct);
            if (empresa is null) return BadRequest(new { message = "La empresa no existe." });
        }
        else if (!string.IsNullOrWhiteSpace(request.EmpresaNombre))
        {
            empresa = new Empresa
            {
                NombreComercial = request.EmpresaNombre.Trim(),
                Estado = EmpresaEstado.Prospecto,
                Origen = "Formulario web",
                ResponsableId = client.AssignedToUserId ?? autorId,
            };
            db.Empresas.Add(empresa);
        }
        else
        {
            return BadRequest(new { message = "Elige una empresa existente o escribe el nombre de una nueva." });
        }

        var nombre = client.FullName.Trim();
        var espacio = nombre.IndexOf(' ');
        var contacto = new Contacto
        {
            Empresa = empresa,
            Nombres = espacio < 0 ? nombre : nombre[..espacio],
            Apellidos = espacio < 0 ? null : nombre[(espacio + 1)..].Trim(),
            Email = client.Email,
            Telefono = client.Phone,
        };
        db.Contactos.Add(contacto);

        var oportunidad = new Oportunidad
        {
            Empresa = empresa,
            Contacto = contacto,
            Titulo = string.IsNullOrWhiteSpace(request.Titulo)
                ? $"{ServicioTipo.Label(client.Service)} para {empresa.NombreComercial}"
                : request.Titulo.Trim(),
            Servicio = client.Service,
            Etapa = OportunidadEtapa.Nuevo,
            ResponsableId = client.AssignedToUserId ?? autorId,
            SolicitudId = client.Id,
        };
        db.Oportunidades.Add(oportunidad);
        db.Actividades.Add(new Actividad
        {
            Empresa = empresa,
            Oportunidad = oportunidad,
            Tipo = ActividadTipo.Nota,
            Descripcion = $"Solicitud del formulario web de {client.FullName}: {client.Message}",
            AutorId = autorId.Value,
        });

        if (client.Status == ClientStatus.Nuevo) client.Status = ClientStatus.Contactado;
        await db.SaveChangesAsync(ct);

        return Ok(new { oportunidadId = oportunidad.Id, empresaId = empresa.Id });
    }

    private Task<int?> FindOportunidadIdAsync(int solicitudId) =>
        db.Oportunidades.Where(o => o.SolicitudId == solicitudId).Select(o => (int?)o.Id).FirstOrDefaultAsync();

    private async Task<int?> GetCurrentUserIdAsync()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
        if (email is null) return null;

        var user = await db.AdminUsers.SingleOrDefaultAsync(u => u.Email == email);
        return user?.Id;
    }

    private static ClientResponse ToResponse(Client client, int? oportunidadId) => new()
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
        OportunidadId = oportunidadId,
    };
}
