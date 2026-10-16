using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ClientNote> ClientNotes => Set<ClientNote>();
    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Contacto> Contactos => Set<Contacto>();
    public DbSet<Oportunidad> Oportunidades => Set<Oportunidad>();
    public DbSet<Actividad> Actividades => Set<Actividad>();

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

        // Comercial. Deleting a company cascades to its contacts, opportunities
        // and activities; every other relationship is NoAction in the database,
        // because SQL Server rejects a second cascade path into the same table
        // (e.g. activity <- opportunity <- company).
        modelBuilder.Entity<Empresa>(entity =>
        {
            entity.HasIndex(e => e.NombreComercial);
            entity.HasIndex(e => e.Estado);
            entity.HasIndex(e => e.Ruc).IsUnique().HasFilter("[Ruc] IS NOT NULL");
            entity.Property(e => e.NombreComercial).HasMaxLength(300).IsRequired();
            entity.Property(e => e.RazonSocial).HasMaxLength(300);
            entity.Property(e => e.Ruc).HasMaxLength(11);
            entity.Property(e => e.Rubro).HasMaxLength(200);
            entity.Property(e => e.SitioWeb).HasMaxLength(500);
            entity.Property(e => e.Direccion).HasMaxLength(500);
            entity.Property(e => e.Distrito).HasMaxLength(120);
            entity.Property(e => e.Provincia).HasMaxLength(120);
            entity.Property(e => e.Estado).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Origen).HasMaxLength(120);
            entity.HasOne(e => e.Responsable)
                .WithMany()
                .HasForeignKey(e => e.ResponsableId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasMany(e => e.Contactos)
                .WithOne(c => c.Empresa)
                .HasForeignKey(c => c.EmpresaId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(e => e.Oportunidades)
                .WithOne(o => o.Empresa)
                .HasForeignKey(o => o.EmpresaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Contacto>(entity =>
        {
            entity.Property(c => c.Nombres).HasMaxLength(150).IsRequired();
            entity.Property(c => c.Apellidos).HasMaxLength(150);
            entity.Property(c => c.Cargo).HasMaxLength(150);
            entity.Property(c => c.Email).HasMaxLength(256);
            entity.Property(c => c.Telefono).HasMaxLength(30);
        });

        modelBuilder.Entity<Oportunidad>(entity =>
        {
            entity.HasIndex(o => o.Etapa);
            entity.HasIndex(o => o.ProximaAccionFecha);
            entity.HasIndex(o => o.SolicitudId).IsUnique().HasFilter("[SolicitudId] IS NOT NULL");
            entity.Property(o => o.Titulo).HasMaxLength(200).IsRequired();
            entity.Property(o => o.Servicio).HasMaxLength(20).IsRequired();
            entity.Property(o => o.Etapa).HasMaxLength(20).IsRequired();
            entity.Property(o => o.ValorEstimado).HasPrecision(14, 2);
            entity.Property(o => o.ProximaAccion).HasMaxLength(300);
            entity.Property(o => o.MotivoPerdida).HasMaxLength(500);
            entity.HasOne(o => o.Contacto)
                .WithMany()
                .HasForeignKey(o => o.ContactoId)
                .OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(o => o.Responsable)
                .WithMany()
                .HasForeignKey(o => o.ResponsableId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(o => o.Solicitud)
                .WithMany()
                .HasForeignKey(o => o.SolicitudId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasMany(o => o.Actividades)
                .WithOne(a => a.Oportunidad)
                .HasForeignKey(a => a.OportunidadId)
                .OnDelete(DeleteBehavior.ClientCascade);
        });

        modelBuilder.Entity<Actividad>(entity =>
        {
            entity.HasIndex(a => new { a.EmpresaId, a.CreatedAtUtc });
            entity.HasIndex(a => new { a.OportunidadId, a.CreatedAtUtc });
            entity.Property(a => a.Tipo).HasMaxLength(20).IsRequired();
            entity.Property(a => a.Descripcion).HasMaxLength(2000).IsRequired();
            entity.HasOne(a => a.Empresa)
                .WithMany()
                .HasForeignKey(a => a.EmpresaId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(a => a.Autor)
                .WithMany()
                .HasForeignKey(a => a.AutorId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
