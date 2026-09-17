namespace Server.Services.Azure;

public class AzureOptions
{
    public const string SectionName = "Azure";

    public required string SubscriptionId { get; set; }
    public required string ResourceGroupName { get; set; }
    public string Location { get; set; } = "eastus";
    public required string KeyVaultName { get; set; }
    public required string ContainerAppsEnvironmentName { get; set; }

    public string KeyVaultUri => $"https://{KeyVaultName}.vault.azure.net/";

    public string KeyVaultResourceId =>
        $"/subscriptions/{SubscriptionId}/resourceGroups/{ResourceGroupName}/providers/Microsoft.KeyVault/vaults/{KeyVaultName}";
}
