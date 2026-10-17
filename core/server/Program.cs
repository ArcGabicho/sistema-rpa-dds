using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using Server.Models;
using Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
// Every action checks the signed-in user's module permissions against the
// database (Services/PermisosFilter.cs).
builder.Services.AddControllers(options => options.Filters.Add<PermisosFilter>());
builder.Services.AddScoped<PermisosService>();

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Falta la cadena de conexión 'ConnectionStrings:Default'.");

// Retry transient failures: the Azure SQL database is serverless and
// auto-pauses, so the first connection after a pause gets error 40613
// ("not currently available") for up to about a minute while it resumes.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sql =>
        sql.EnableRetryOnFailure(maxRetryCount: 10, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)));

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<BovedaCifrado>();
// PDD drafting with Claude (Services/IaRedactor.cs). IA:BaseUrl is only
// changed to point the tests at a stand-in for Anthropic's API.
builder.Services.AddHttpClient<IaRedactor>(client =>
{
    client.BaseAddress = new Uri((builder.Configuration["IA:BaseUrl"] is { Length: > 0 } url ? url : "https://api.anthropic.com").TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(90);
});
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

// Rate limits for every request, the login and the contact form (see
// Services/RateLimiting.cs), plus the per-account login lockout.
builder.Services.AddRateLimits();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<LoginThrottle>();

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

// Apply pending migrations and seed the admin user (and, in development, the
// demo prospect base) on startup.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    await db.Database.MigrateAsync();
    await AdminSeeder.SeedAsync(db, app.Configuration, logger);
    await EmpresaSeeder.SeedAsync(db, app.Configuration, logger);
    // Resolved here so a malformed vault key stops the API at startup.
    var cifrado = scope.ServiceProvider.GetRequiredService<BovedaCifrado>();
    await BovedaSeeder.SeedAsync(db, app.Configuration, cifrado, logger);
    await DiagnosticoSeeder.SeedAsync(db, app.Configuration, logger);
    await PropuestaSeeder.SeedAsync(db, app.Configuration, logger);
    await ProyectoSeeder.SeedAsync(db, app.Configuration, logger);
    await OperacionSeeder.SeedAsync(db, app.Configuration, logger);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("client");
// After authentication, so the global limit can tell users apart.
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();

app.Run();
