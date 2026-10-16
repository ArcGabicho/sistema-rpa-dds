using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace Server.Services;

// The visitor's IP, for rate limiting. Browsers reach the login and the
// contact form through the website's server (Vercel), so to the API every one
// of those requests comes from Vercel's IP. The website passes the visitor's
// IP along in X-Client-Ip, signed with an HMAC of the JWT secret both sides
// share: a forged header (someone calling the API directly to dodge the
// limits) fails the check and the connection's own IP is used instead.
public static class ClientIp
{
    public const string Header = "X-Client-Ip";
    public const string SignatureHeader = "X-Client-Ip-Signature";

    public static string Resolve(HttpContext context)
    {
        var forwarded = context.Request.Headers[Header].ToString();
        var signature = context.Request.Headers[SignatureHeader].ToString();
        if (forwarded.Length > 0 && signature.Length > 0 && IPAddress.TryParse(forwarded, out _))
        {
            var secret = context.RequestServices.GetRequiredService<IOptions<JwtOptions>>().Value.Secret;
            if (IsValid(forwarded, signature, secret)) return forwarded;
        }
        return context.Connection.RemoteIpAddress?.ToString() ?? "desconocida";
    }

    private static bool IsValid(string ip, string signature, string secret)
    {
        // "client-ip:" keeps this HMAC from ever matching a JWT signature.
        var expected = HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes($"client-ip:{ip}"));
        byte[] given;
        try
        {
            given = Convert.FromHexString(signature);
        }
        catch (FormatException)
        {
            return false;
        }
        return CryptographicOperations.FixedTimeEquals(expected, given);
    }
}
