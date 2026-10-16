using Microsoft.Extensions.Caching.Memory;

namespace Server.Services;

// Per-account lockout on top of the per-IP login limit: 5 failed attempts on
// one email within 15 minutes lock it for 15 minutes, from any IP. Emails
// that don't exist are counted too, so the lockout doesn't reveal which
// accounts are real. In memory: fine for a single API instance; with several,
// this would move to a shared store.
public sealed class LoginThrottle(IMemoryCache cache)
{
    private const int MaxFallos = 5;
    private static readonly TimeSpan Ventana = TimeSpan.FromMinutes(15);

    private sealed class Registro
    {
        public int Fallos;
        public DateTime? BloqueadoHastaUtc;
    }

    private static string Key(string email) => $"login:{email}";

    // How long the account is still locked, or null if it isn't.
    public TimeSpan? Bloqueo(string email)
    {
        if (!cache.TryGetValue(Key(email), out Registro? registro) || registro?.BloqueadoHastaUtc is not { } hasta)
            return null;
        var restante = hasta - DateTime.UtcNow;
        return restante > TimeSpan.Zero ? restante : null;
    }

    public void Fallo(string email)
    {
        var registro = cache.GetOrCreate(Key(email), entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = Ventana;
            return new Registro();
        })!;

        lock (registro)
        {
            registro.Fallos++;
            if (registro.Fallos >= MaxFallos)
            {
                registro.BloqueadoHastaUtc = DateTime.UtcNow + Ventana;
                cache.Set(Key(email), registro, Ventana);
            }
        }
    }

    public void Exito(string email) => cache.Remove(Key(email));
}
