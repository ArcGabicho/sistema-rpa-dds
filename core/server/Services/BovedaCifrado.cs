using System.Security.Cryptography;
using System.Text;

namespace Server.Services;

// Encrypts the vault's values with AES-256-GCM under a master key that only
// lives in the API's environment (Boveda:ClaveMaestra, 32 random bytes in
// base64), so the database alone — a backup, a leaked connection string —
// never exposes a secret. Losing the key means losing every value: keep a
// copy of it outside the server (a password manager).
//
// Stored format: [version 1 byte][nonce 12][tag 16][ciphertext], with the
// secret's Uid as associated data.
public sealed class BovedaCifrado
{
    private const byte Version = 1;
    private const int NonceSize = 12;
    private const int TagSize = 16;

    private readonly byte[]? clave;

    public BovedaCifrado(IConfiguration config, ILogger<BovedaCifrado> logger)
    {
        var base64 = config["Boveda:ClaveMaestra"];
        if (string.IsNullOrWhiteSpace(base64))
        {
            logger.LogWarning("Boveda:ClaveMaestra no está configurada: la bóveda no podrá guardar ni revelar valores.");
            return;
        }

        // A bad key fails at startup rather than writing values nobody can read back.
        try
        {
            clave = Convert.FromBase64String(base64.Trim());
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Boveda:ClaveMaestra debe estar en base64 (genera una con: openssl rand -base64 32).");
        }
        if (clave.Length != 32)
            throw new InvalidOperationException("Boveda:ClaveMaestra debe tener 32 bytes (genera una con: openssl rand -base64 32).");
    }

    public bool Configurada => clave is not null;

    public byte[] Cifrar(string valor, Guid uid)
    {
        var key = clave ?? throw new InvalidOperationException("La bóveda no está configurada.");
        var plano = Encoding.UTF8.GetBytes(valor);
        var resultado = new byte[1 + NonceSize + TagSize + plano.Length];
        resultado[0] = Version;
        var nonce = resultado.AsSpan(1, NonceSize);
        var tag = resultado.AsSpan(1 + NonceSize, TagSize);
        var cifrado = resultado.AsSpan(1 + NonceSize + TagSize);

        RandomNumberGenerator.Fill(nonce);
        using var aes = new AesGcm(key, TagSize);
        aes.Encrypt(nonce, plano, cifrado, tag, uid.ToByteArray());
        CryptographicOperations.ZeroMemory(plano);
        return resultado;
    }

    public string Descifrar(byte[] datos, Guid uid)
    {
        var key = clave ?? throw new InvalidOperationException("La bóveda no está configurada.");
        if (datos.Length < 1 + NonceSize + TagSize || datos[0] != Version)
            throw new CryptographicException("Formato de valor cifrado desconocido.");

        var nonce = datos.AsSpan(1, NonceSize);
        var tag = datos.AsSpan(1 + NonceSize, TagSize);
        var cifrado = datos.AsSpan(1 + NonceSize + TagSize);
        var plano = new byte[cifrado.Length];
        try
        {
            using var aes = new AesGcm(key, TagSize);
            aes.Decrypt(nonce, cifrado, tag, plano, uid.ToByteArray());
            return Encoding.UTF8.GetString(plano);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(plano);
        }
    }
}
