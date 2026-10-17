using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services;

namespace Server.Controllers;

// Contacts are created under their company (POST /api/empresas/{id}/contactos);
// this controller edits and removes them.
[ApiController]
[Route("api/contactos")]
[Authorize]
[Modulo(Modulo.Comercial)]
public class ContactosController(AppDbContext db) : ControllerBase
{
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ContactoResponse>> Update(int id, ContactoRequest request, CancellationToken ct)
    {
        var contacto = await db.Contactos.FindAsync([id], ct);
        if (contacto is null) return NotFound();

        Apply(contacto, request);
        await db.SaveChangesAsync(ct);
        return Ok(ComercialMapping.ToContacto(contacto));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var contacto = await db.Contactos.FindAsync([id], ct);
        if (contacto is null) return NotFound();

        // The FK from opportunities is NoAction in the database (see
        // AppDbContext), so detach them first.
        await db.Oportunidades
            .Where(o => o.ContactoId == id)
            .ExecuteUpdateAsync(set => set.SetProperty(o => o.ContactoId, (int?)null), ct);

        db.Contactos.Remove(contacto);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    internal static void Apply(Contacto contacto, ContactoRequest request)
    {
        contacto.Nombres = request.Nombres.Trim();
        contacto.Apellidos = Normalize(request.Apellidos);
        contacto.Cargo = Normalize(request.Cargo);
        contacto.Email = Normalize(request.Email)?.ToLowerInvariant();
        contacto.Telefono = Normalize(request.Telefono);
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
