using System.Text;
using System.Threading.RateLimiting;
using Azure.Core;
using Azure.Identity;
using Azure.ResourceManager;
using Azure.Security.KeyVault.Secrets;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using Server.Models;
using Server.Services;
using Server.Services.Azure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddControllers();

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Falta la cadena de conexión 'ConnectionStrings:Default'.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<PasswordHasher<AdminUser>>();

var jwtSecret = builder.Configuration[$"{JwtOptions.SectionName}:Secret"]
    ?? throw new InvalidOperationException("Falta la clave 'Jwt:Secret'.");
var jwtIssuer = builder.Configuration[$"{JwtOptions.SectionName}:Issuer"] ?? "dds-server";
var jwtAudience = builder.Configuration[$"{JwtOptions.SectionName}:Audience"] ?? "dds-client";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        };
    });
builder.Services.AddAuthorization();

// Rate limiting: guard the login endpoint against brute-force attempts.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
            }));

    // Guard the public contact form against spam submissions.
    options.AddPolicy("contact", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0,
            }));
});

// Azure integration for implementación deployments (ARM + Key Vault). Kept
// optional at startup — a missing/incomplete Azure section must not prevent
// the rest of the app (auth, clientes) from running in local dev, where no
// real Azure subscription is configured. Deploy calls fail gracefully at
// call time instead (see ImplementacionService's error handling).
var azureSection = builder.Configuration.GetSection(AzureOptions.SectionName);
builder.Services.Configure<AzureOptions>(azureSection);

var azureSubscriptionId = azureSection["SubscriptionId"] ?? "";
var azureKeyVaultName = azureSection["KeyVaultName"] ?? "";

// AZURE_CLIENT_ID (set by main.bicep to the container app's user-assigned
// identity) tells DefaultAzureCredential which managed identity to use —
// without it, ManagedIdentityCredential can't disambiguate and auth fails.
// Locally (no managed identity available) it falls back through the rest of
// the default chain, e.g. `az login`.
var managedIdentityClientId = builder.Configuration["AZURE_CLIENT_ID"];
var defaultCredential = string.IsNullOrEmpty(managedIdentityClientId)
    ? new DefaultAzureCredential()
    : new DefaultAzureCredential(new DefaultAzureCredentialOptions { ManagedIdentityClientId = managedIdentityClientId });

// A blank subscription/vault name (local dev without Azure configured) must
// still produce a constructible client — any real operation then fails at
// call time with a clear Azure error, caught by ImplementacionService,
// instead of an invalid Uri/empty id crashing DI for every single request.
var keyVaultUri = string.IsNullOrEmpty(azureKeyVaultName)
    ? "https://not-configured.vault.azure.net/"
    : $"https://{azureKeyVaultName}.vault.azure.net/";

builder.Services.AddSingleton<TokenCredential>(defaultCredential);
builder.Services.AddSingleton(sp =>
    new ArmClient(sp.GetRequiredService<TokenCredential>(), azureSubscriptionId));
builder.Services.AddSingleton(sp =>
    new SecretClient(new Uri(keyVaultUri), sp.GetRequiredService<TokenCredential>()));
builder.Services.AddSingleton<CredentialVaultService>();
builder.Services.AddSingleton<ArmDeploymentService>();
builder.Services.AddScoped<ImplementacionService>();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("client", policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// Apply pending migrations and seed the admin user on startup.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    await db.Database.MigrateAsync();
    await AdminSeeder.SeedAsync(db, app.Configuration, logger);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("client");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();

app.Run();
