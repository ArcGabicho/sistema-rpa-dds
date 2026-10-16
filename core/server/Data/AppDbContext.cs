using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<ClientNote> ClientNotes => Set<ClientNote>();
    public DbSet<Secreto> Secretos => Set<Secreto>();
    public DbSet<Diagnostico> Diagnosticos => Set<Diagnostico>();
    public DbSet<ProcesoEvaluado> ProcesosEvaluados => Set<ProcesoEvaluado>();
    public DbSet<AccesoSecreto> AccesosSecreto => Set<AccesoSecreto>();
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
                .OnDelete(DeleteBehavior.SetNull);
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
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Diagnóstico y ROI. A diagnosis goes with its company; its link to an
        // opportunity is NoAction in the database (ClientSetNull) — deleting
        // the company already cascades along a second path through the
        // opportunity, which SQL Server refuses — and the opportunities API
        // detaches diagnoses before deleting one.
        modelBuilder.Entity<Diagnostico>(entity =>
        {
            entity.HasIndex(d => d.Estado);
            entity.Property(d => d.Titulo).HasMaxLength(200).IsRequired();
            entity.Property(d => d.Estado).HasMaxLength(20).IsRequired();
            entity.Property(d => d.CostoHora).HasPrecision(10, 2);
            entity.Property(d => d.Resumen).HasMaxLength(4000);
            entity.HasOne(d => d.Empresa)
                .WithMany()
                .HasForeignKey(d => d.EmpresaId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(d => d.Oportunidad)
                .WithMany()
                .HasForeignKey(d => d.OportunidadId)
                .OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.Responsable)
                .WithMany()
                .HasForeignKey(d => d.ResponsableId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProcesoEvaluado>(entity =>
        {
            entity.HasIndex(p => new { p.DiagnosticoId, p.Orden });
            entity.Property(p => p.Nombre).HasMaxLength(200).IsRequired();
            entity.Property(p => p.Area).HasMaxLength(120);
            entity.Property(p => p.Descripcion).HasMaxLength(2000);
            entity.Property(p => p.Servicio).HasMaxLength(20).IsRequired();
            entity.Property(p => p.MinutosPorEjecucion).HasPrecision(10, 2);
            entity.Property(p => p.TasaError).HasPrecision(5, 2);
            entity.Property(p => p.CostoHora).HasPrecision(10, 2);
            entity.Property(p => p.PorcentajeAutomatizable).HasPrecision(5, 2);
            entity.Property(p => p.CostoImplementacion).HasPrecision(14, 2);
            entity.Property(p => p.CostoMensual).HasPrecision(14, 2);
            entity.HasOne(p => p.Diagnostico)
                .WithMany(d => d.Procesos)
                .HasForeignKey(p => p.DiagnosticoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Bóveda. A company's secrets go with it; the audit trail outlives
        // both the secret and the user (SetNull, with names copied in).
        modelBuilder.Entity<Secreto>(entity =>
        {
            entity.HasIndex(s => s.Uid).IsUnique();
            entity.HasIndex(s => s.Nombre);
            entity.HasIndex(s => s.VenceEl);
            entity.Property(s => s.Nombre).HasMaxLength(200).IsRequired();
            entity.Property(s => s.Tipo).HasMaxLength(20).IsRequired();
            entity.Property(s => s.Usuario).HasMaxLength(256);
            entity.Property(s => s.Url).HasMaxLength(500);
            entity.Property(s => s.Notas).HasMaxLength(1000);
            entity.Property(s => s.ValorCifrado).IsRequired();
            entity.HasOne(s => s.Empresa)
                .WithMany()
                .HasForeignKey(s => s.EmpresaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AccesoSecreto>(entity =>
        {
            entity.HasIndex(a => new { a.SecretoId, a.CreatedAtUtc });
            entity.HasIndex(a => a.CreatedAtUtc);
            entity.Property(a => a.SecretoNombre).HasMaxLength(200).IsRequired();
            entity.Property(a => a.UsuarioNombre).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Accion).HasMaxLength(20).IsRequired();
            entity.Property(a => a.Ip).HasMaxLength(64);
            entity.HasOne(a => a.Secreto)
                .WithMany(s => s.Accesos)
                .HasForeignKey(a => a.SecretoId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(a => a.Usuario)
                .WithMany()
                .HasForeignKey(a => a.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
