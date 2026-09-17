using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Server.Models;

namespace Server.Services;

public class TokenService(IOptions<JwtOptions> jwtOptions)
{
    private readonly JwtOptions _options = jwtOptions.Value;

    // "Remember me" keeps the session alive for a month instead of the usual
    // short-lived window.
    private const int RememberMeExpiresInMinutes = 60 * 24 * 30;

    public (string Token, int ExpiresInSeconds) CreateToken(AdminUser user, bool rememberMe = false)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("name", user.FullName),
            new Claim("role", user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresInMinutes = rememberMe ? RememberMeExpiresInMinutes : _options.ExpiresInMinutes;
        var expires = DateTime.UtcNow.AddMinutes(expiresInMinutes);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        var handler = new JwtSecurityTokenHandler();
        var expiresInSeconds = (int)(expires - DateTime.UtcNow).TotalSeconds;
        return (handler.WriteToken(token), expiresInSeconds);
    }
}
