using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services;

// Demo vault for local development (Seed:DatosDemo): DDS's own keys and the
// credentials of the demo companies that are already clients, with a short
// access history. Every value is random and fake. Runs once the companies
// exist and only if the vault has a master key and no secrets yet.
public static class BovedaSeeder
{
    private const int Semilla = 20261017;

    public static async Task SeedAsync(AppDbContext db, IConfiguration config, BovedaCifrado cifrado, ILogger logger, CancellationToken ct = default)
    {
        if (!config.GetValue<bool>("Seed:DatosDemo") || !cifrado.Configurada) return;
        if (await db.Secretos.AnyAsync(ct)) return;

        var admin = await db.AdminUsers.OrderBy(u => u.Id).Select(u => new { u.Id, u.FullName }).FirstOrDefaultAsync(ct);
        if (admin is null) return;

        var clientes = await db.Empresas
            .Where(e => e.Estado == EmpresaEstado.Cliente)
            .OrderBy(e => e.Id)
            .Select(e => new { e.Id, e.NombreComercial, e.UpdatedAtUtc })
            .ToListAsync(ct);

        var rnd = new Random(Semilla);
        var ahora = DateTime.UtcNow;
        var hoy = Lima.Hoy;
        var secretos = new List<Secreto>();

        Secreto Nuevo(string nombre, string tipo, int? empresaId, string? usuario, string? url, string valor, DateTime creado, DateTime? vence, bool restringido = false, string? notas = null, string? empresa = null)
        {
            var secreto = new Secreto
            {
                Nombre = nombre,
                Tipo = tipo,
                EmpresaId = empresaId,
                Usuario = usuario,
                Url = url,
                Notas = notas,
                ValorCifrado = [],
                Restringido = restringido,
                VenceEl = vence,
                RotadoAtUtc = creado,
                CreatedAtUtc = creado,
                UpdatedAtUtc = creado,
            };
            secreto.ValorCifrado = cifrado.Cifrar(valor, secreto.Uid);

            // Created, then looked at a few times since.
            // Named as the API logs it: "secret · company".
            var enRegistro = empresa is null ? nombre : $"{nombre} · {empresa}";
            secreto.Accesos.Add(Acceso(enRegistro, SecretoAccion.Creado, creado));
            var vistas = rnd.Next(0, 4);
            for (var i = 0; i < vistas; i++)
            {
                var cuando = creado.AddMinutes(rnd.NextDouble() * (ahora - creado).TotalMinutes);
                secreto.Accesos.Add(Acceso(enRegistro, rnd.Next(2) == 0 ? SecretoAccion.Revelado : SecretoAccion.Copiado, cuando));
            }
            secretos.Add(secreto);
            return secreto;
        }

        AccesoSecreto Acceso(string secretoNombre, string accion, DateTime cuando) => new()
        {
            SecretoNombre = secretoNombre,
            UsuarioId = admin.Id,
            UsuarioNombre = admin.FullName,
            Accion = accion,
            // Documentation range (RFC 5737): clearly not a real address.
            Ip = $"192.0.2.{rnd.Next(10, 250)}",
            CreatedAtUtc = cuando,
        };

        DateTime? Vence() => rnd.NextDouble() < 0.4 ? null : hoy.AddDays(rnd.Next(-20, 180));

        // DDS's own.
        var inicio = ahora.AddDays(-200);
        Nuevo("OpenAI — API key de DDS", SecretoTipo.ApiKey, null, null, "platform.openai.com", $"demo_{Hex(rnd, 40)}", inicio, null, restringido: true,
            notas: "Proyecto compartido por los asistentes de IA de los clientes.");
        Nuevo("n8n de DDS — token de la API", SecretoTipo.Token, null, null, "n8n.dds.example", $"demo_{Hex(rnd, 48)}", inicio.AddDays(10), hoy.AddDays(25));
        Nuevo("Correo de notificaciones (SMTP)", SecretoTipo.Credencial, null, "notificaciones@dds.example", "smtp.dds.example:587", Clave(rnd), inicio.AddDays(20), null);
        Nuevo("Cloudflare R2 — llave de acceso", SecretoTipo.ApiKey, null, $"demo{Hex(rnd, 12)}", "r2.cloudflarestorage.com", $"demo_{Hex(rnd, 64)}", inicio.AddDays(30), hoy.AddDays(-5), restringido: true);

        // Each client's: what its bots log into.
        foreach (var cliente in clientes)
        {
            var dominio = $"{EmpresaSeeder.Slug(cliente.NombreComercial)}.example";
            var creado = Min(ahora.AddDays(-1), cliente.UpdatedAtUtc.AddDays(rnd.Next(1, 10)));
            var plantillas = Plantillas(dominio).OrderBy(_ => rnd.Next()).Take(rnd.Next(1, 4));
            foreach (var (nombre, tipo, usuario, url, valor) in plantillas)
            {
                Nuevo(nombre, tipo, cliente.Id, usuario, url, valor(rnd), creado, Vence(), empresa: cliente.NombreComercial);
                creado = Min(ahora.AddDays(-1), creado.AddDays(rnd.Next(1, 20)));
            }
        }

        db.Secretos.AddRange(secretos);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Datos demo: {Secretos} secretos en la bóveda.", secretos.Count);
    }

    private static (string Nombre, string Tipo, string? Usuario, string Url, Func<Random, string> Valor)[] Plantillas(string dominio) =>
    [
        ("SAP — usuario del bot", SecretoTipo.Credencial, "BOT_RPA", $"sap.{dominio}", Clave),
        ("Banca por internet — conciliación", SecretoTipo.Credencial, "rpa.conciliacion", $"banca.{dominio}", Clave),
        ("Clave SOL de SUNAT", SecretoTipo.Credencial, "BOTRPA01", "e-menu.sunat.gob.pe", Clave),
        ("Base de reportes (solo lectura)", SecretoTipo.Conexion, "lectura", $"sql.{dominio}",
            r => $"Server=sql.{dominio};Database=reportes;User Id=lectura;Password={Clave(r)};Encrypt=True;"),
        ("API de facturación electrónica", SecretoTipo.ApiKey, null, $"api.{dominio}", r => $"demo_{Hex(r, 40)}"),
        ("Buzón de facturas (IMAP)", SecretoTipo.Credencial, $"facturas@{dominio}", $"imap.{dominio}", Clave),
    ];

    private const string Caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#$%&*+-?";

    private static string Clave(Random rnd) => new([.. Enumerable.Range(0, 20).Select(_ => Caracteres[rnd.Next(Caracteres.Length)])]);

    private static string Hex(Random rnd, int length) => new([.. Enumerable.Range(0, length).Select(_ => "0123456789abcdef"[rnd.Next(16)])]);

    private static DateTime Min(DateTime a, DateTime b) => a < b ? a : b;
}
