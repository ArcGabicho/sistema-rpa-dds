using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services;

public static class AdminSeeder
{
    public static async Task SeedAsync(AppDbContext db, IConfiguration config, ILogger logger)
    {
        var email = config["Admin:Email"];
        var password = config["Admin:Password"];
        var fullName = config["Admin:FullName"] ?? "Administrador";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning(
                "Admin:Email o Admin:Password no configurados; se omite la creación del usuario administrador."
            );
            return;
        }

        email = email.Trim().ToLowerInvariant();
        var exists = await db.AdminUsers.AnyAsync(u => u.Email == email);
        if (exists) return;

        var hasher = new PasswordHasher<AdminUser>();
        var admin = new AdminUser
        {
            Email = email,
            FullName = fullName,
            PasswordHash = string.Empty,
        };
        admin.PasswordHash = hasher.HashPassword(admin, password);

        db.AdminUsers.Add(admin);
        await db.SaveChangesAsync();
        logger.LogInformation("Usuario administrador creado: {Email}", email);
    }
}
