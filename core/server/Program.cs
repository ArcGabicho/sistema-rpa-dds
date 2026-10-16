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
builder.Services.AddControllers();

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
