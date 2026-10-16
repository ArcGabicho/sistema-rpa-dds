using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Server.Data;

namespace Server.Services;

public static class CurrentUserExtensions
{
    // The signed-in admin user's id, looked up by the JWT's email claim (so a
    // token for a deleted user resolves to null). Same lookup the original
    // controllers do inline.
    public static async Task<int?> GetCurrentUserIdAsync(this AppDbContext db, ClaimsPrincipal user, CancellationToken ct = default)
    {
        var email = user.FindFirst(ClaimTypes.Email)?.Value ?? user.FindFirst("email")?.Value;
        if (email is null) return null;

        return await db.AdminUsers
            .Where(u => u.Email == email)
            .Select(u => (int?)u.Id)
            .SingleOrDefaultAsync(ct);
    }
}
