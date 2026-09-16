namespace Server.Services;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public required string Secret { get; set; }
    public string Issuer { get; set; } = "dds-server";
    public string Audience { get; set; } = "dds-client";
    public int ExpiresInMinutes { get; set; } = 60;
}
