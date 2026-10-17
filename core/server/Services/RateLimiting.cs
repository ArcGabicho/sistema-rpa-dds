using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Server.Services;

// Request limits, all keyed by the visitor's real IP (see ClientIp) or, once
// signed in, by user:
// - every request: 300 a minute per user, 120 a minute per anonymous IP;
// - "login": 10 attempts per IP in any 5 minutes (plus LoginThrottle's
//   per-account lockout);
// - "contact": 5 contact-form submissions per IP every 10 minutes;
// - "boveda": 30 secrets revealed per user in any 5 minutes, so an account
//   in the wrong hands can't dump the vault in one go;
// - "ia": 10 AI drafts per user in any 10 minutes (each one is a paid call).
// A rejected request gets a 429 with Retry-After and a { message } to show.
public static class RateLimiting
{
    public const string Login = "login";
    public const string Contact = "contact";
    public const string Boveda = "boveda";
    public const string Ia = "ia";

    public static IServiceCollection AddRateLimits(this IServiceCollection services)
    {
        return services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = (context, ct) =>
            {
                var espera = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
                    ? retryAfter
                    : TimeSpan.FromMinutes(1);
                return WriteTooManyAsync(context.HttpContext, espera, ct);
            };

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                if (context.Request.Path.StartsWithSegments("/health")) return RateLimitPartition.GetNoLimiter("health");

                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                return userId is not null
                    ? PorMinuto($"user:{userId}", 300)
                    : PorMinuto($"ip:{ClientIp.Resolve(context)}", 120);
            });

            options.AddPolicy(Login, context =>
                RateLimitPartition.GetSlidingWindowLimiter(ClientIp.Resolve(context), _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(5),
                    SegmentsPerWindow = 5,
                    QueueLimit = 0,
                }));

            options.AddPolicy(Boveda, context =>
                RateLimitPartition.GetSlidingWindowLimiter(
                    context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? ClientIp.Resolve(context),
                    _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = 30,
                        Window = TimeSpan.FromMinutes(5),
                        SegmentsPerWindow = 5,
                        QueueLimit = 0,
                    }));

            options.AddPolicy(Ia, context =>
                RateLimitPartition.GetSlidingWindowLimiter(
                    context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? ClientIp.Resolve(context),
                    _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(10),
                        SegmentsPerWindow = 5,
                        QueueLimit = 0,
                    }));

            options.AddPolicy(Contact, context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientIp.Resolve(context), _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(10),
                    QueueLimit = 0,
                }));
        });
    }

    public static async ValueTask WriteTooManyAsync(HttpContext context, TimeSpan espera, CancellationToken ct = default)
    {
        var segundos = Math.Max(1, (int)Math.Ceiling(espera.TotalSeconds));
        context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.Response.Headers.RetryAfter = segundos.ToString();
        await context.Response.WriteAsJsonAsync(new { message = Mensaje(segundos), retryAfterSeconds = segundos }, ct);
    }

    public static string Mensaje(int segundos)
    {
        var minutos = (int)Math.Ceiling(segundos / 60.0);
        return segundos < 60
            ? $"Demasiados intentos. Intenta de nuevo en {segundos} segundos."
            : $"Demasiados intentos. Intenta de nuevo en {minutos} {(minutos == 1 ? "minuto" : "minutos")}.";
    }

    private static RateLimitPartition<string> PorMinuto(string key, int limite) =>
        RateLimitPartition.GetTokenBucketLimiter(key, _ => new TokenBucketRateLimiterOptions
        {
            TokenLimit = limite,
            TokensPerPeriod = limite,
            ReplenishmentPeriod = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        });
}
