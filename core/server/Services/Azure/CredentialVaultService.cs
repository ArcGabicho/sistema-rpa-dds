using Azure;
using Azure.Security.KeyVault.Secrets;

namespace Server.Services.Azure;

// Stores implementación credentials in Key Vault — they never touch the
// database. Deployment parameters reference these secrets by name via ARM's
// native Key Vault `reference()` mechanism, so the plaintext value is
// resolved by Azure itself at deploy time and never passes through this API.
public class CredentialVaultService(SecretClient secretClient, ILogger<CredentialVaultService> logger)
{
    public async Task<Dictionary<string, string>> SaveCredentialsAsync(
        string implementacionKey,
        IReadOnlyDictionary<string, string> credentials,
        CancellationToken cancellationToken = default)
    {
        var secretNames = new Dictionary<string, string>();
        foreach (var (key, value) in credentials)
        {
            var secretName = BuildSecretName(implementacionKey, key);
            await secretClient.SetSecretAsync(secretName, value, cancellationToken);
            secretNames[key] = secretName;
        }

        return secretNames;
    }

    public async Task DeleteCredentialsAsync(
        string implementacionKey,
        IEnumerable<string> credentialKeys,
        CancellationToken cancellationToken = default)
    {
        foreach (var key in credentialKeys)
        {
            var secretName = BuildSecretName(implementacionKey, key);
            try
            {
                await secretClient.StartDeleteSecretAsync(secretName, cancellationToken);
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                // Already gone; nothing to do.
            }
            catch (RequestFailedException ex)
            {
                logger.LogWarning(ex, "No se pudo eliminar el secreto {SecretName} de Key Vault", secretName);
            }
        }
    }

    public static string BuildSecretName(string implementacionKey, string credentialKey) =>
        $"impl-{implementacionKey}-{credentialKey}".ToLowerInvariant();
}
