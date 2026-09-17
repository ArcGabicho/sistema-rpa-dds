using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ClientNote> ClientNotes => Set<ClientNote>();
    public DbSet<Implementacion> Implementaciones => Set<Implementacion>();
    public DbSet<ImplementacionLog> ImplementacionLogs => Set<ImplementacionLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Email).HasMaxLength(256).IsRequired();
            entity.Property(u => u.FullName).HasMaxLength(200).IsRequired();
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.Role).HasMaxLength(20).IsRequired();
        });

        modelBuilder.Entity<Client>(entity =>
        {
            entity.HasIndex(c => c.CreatedAtUtc);
            entity.Property(c => c.FullName).HasMaxLength(200).IsRequired();
            entity.Property(c => c.Email).HasMaxLength(256).IsRequired();
            entity.Property(c => c.Phone).HasMaxLength(30).IsRequired();
            entity.Property(c => c.Service).HasMaxLength(50).IsRequired();
            entity.Property(c => c.Message).HasMaxLength(600).IsRequired();
            entity.Property(c => c.Status).HasMaxLength(20).IsRequired();
            entity.HasOne(c => c.AssignedToUser)
                .WithMany()
                .HasForeignKey(c => c.AssignedToUserId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasMany(c => c.Notes)
                .WithOne(n => n.Client)
                .HasForeignKey(n => n.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ClientNote>(entity =>
        {
            entity.HasIndex(n => new { n.ClientId, n.CreatedAtUtc });
            entity.Property(n => n.Message).HasMaxLength(1000).IsRequired();
            entity.HasOne(n => n.AuthorUser)
                .WithMany()
                .HasForeignKey(n => n.AuthorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Implementacion>(entity =>
        {
            entity.HasIndex(i => i.CreatedAtUtc);
            entity.Property(i => i.TemplateId).HasMaxLength(100).IsRequired();
            entity.Property(i => i.Name).HasMaxLength(100).IsRequired();
            entity.Property(i => i.Status).HasMaxLength(20).IsRequired();
            entity.Property(i => i.ResourceGroupName).HasMaxLength(100).IsRequired();
            entity.Property(i => i.DeploymentName).HasMaxLength(100).IsRequired();
            entity.HasOne(i => i.AdminUser)
                .WithMany()
                .HasForeignKey(i => i.AdminUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(i => i.Logs)
                .WithOne(l => l.Implementacion)
                .HasForeignKey(l => l.ImplementacionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ImplementacionLog>(entity =>
        {
            entity.HasIndex(l => new { l.ImplementacionId, l.TimestampUtc });
            entity.Property(l => l.Level).HasMaxLength(20).IsRequired();
            entity.Property(l => l.Message).HasMaxLength(1000).IsRequired();
        });
    }
}
