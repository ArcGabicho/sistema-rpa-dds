using Azure;
using Azure.Core;
using Azure.ResourceManager;
using Azure.ResourceManager.Resources;
using Azure.ResourceManager.Resources.Models;
using Microsoft.Extensions.Options;

namespace Server.Services.Azure;

public record DeploymentStatusResult(
    string Status,
    Dictionary<string, string>? Outputs,
    string? ErrorMessage
);

// Thin wrapper around the Azure.ResourceManager SDK for the two things the
// implementación pipeline needs: run an ARM deployment from a compiled Bicep
// (ARM JSON) template, and tear down whatever it created by tag. Kept
// separate from ImplementacionService so the orchestration/DB logic doesn't
// have to know about ARM's resource/operation types directly.
public class ArmDeploymentService(ArmClient armClient, IOptions<AzureOptions> azureOptions, ILogger<ArmDeploymentService> logger)
{
    private AzureOptions Options => azureOptions.Value;

    private SubscriptionResource Subscription =>
        armClient.GetSubscriptionResource(SubscriptionResource.CreateResourceIdentifier(Options.SubscriptionId));

    private ResourceGroupResource ResourceGroup =>
        armClient.GetResourceGroupResource(ResourceGroupResource.CreateResourceIdentifier(Options.SubscriptionId, Options.ResourceGroupName));

    public async Task EnsureResourceGroupAsync(CancellationToken cancellationToken = default)
    {
        await Subscription.GetResourceGroups().CreateOrUpdateAsync(
            WaitUntil.Completed,
            Options.ResourceGroupName,
            new ResourceGroupData(new AzureLocation(Options.Location)),
            cancellationToken);
    }

    // Kicks off the deployment and returns immediately (WaitUntil.Started) —
    // deployments take minutes, so the caller persists status="deploying"
    // and polls GetDeploymentStatusAsync later rather than blocking the request.
    public async Task StartDeploymentAsync(
        string deploymentName,
        string templateJson,
        IReadOnlyDictionary<string, object> parameters,
        CancellationToken cancellationToken = default)
    {
        var parametersPayload = parameters.ToDictionary(
            kv => kv.Key,
            kv => (object)new { value = kv.Value });

        var content = new ArmDeploymentContent(new ArmDeploymentProperties(ArmDeploymentMode.Incremental)
        {
            Template = BinaryData.FromString(templateJson),
            Parameters = BinaryData.FromObjectAsJson(parametersPayload),
        });

        await ResourceGroup.GetArmDeployments().CreateOrUpdateAsync(
            WaitUntil.Started,
            deploymentName,
            content,
            cancellationToken);
    }

    public async Task<DeploymentStatusResult> GetDeploymentStatusAsync(string deploymentName, CancellationToken cancellationToken = default)
    {
        ArmDeploymentResource deployment;
        try
        {
            deployment = await ResourceGroup.GetArmDeployments().GetAsync(deploymentName, cancellationToken);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return new DeploymentStatusResult("deploying", null, null);
        }

        var props = deployment.Data.Properties;
        var state = props.ProvisioningState;

        if (state == ResourcesProvisioningState.Succeeded)
        {
            var outputs = ParseOutputs(props.Outputs);
            return new DeploymentStatusResult("running", outputs, null);
        }

        if (state == ResourcesProvisioningState.Failed || state == ResourcesProvisioningState.Canceled)
        {
            var message = props.Error?.Message ?? "El deployment falló en Azure sin un mensaje de error específico.";
            return new DeploymentStatusResult("error", null, message);
        }

        // Accepted, Running, Creating, Updating, etc. — still in progress.
        return new DeploymentStatusResult("deploying", null, null);
    }

    // Deletes every resource tagged with this implementación's id. Deleting an
    // ARM *deployment* record does not delete the resources it created, so we
    // find them by tag instead (they all share the 'dds-implementacion-id' tag,
    // set by every implementación Bicep template).
    public async Task DeleteTaggedResourcesAsync(string implementacionId, CancellationToken cancellationToken = default)
    {
        var filter = $"tagName eq 'dds-implementacion-id' and tagValue eq '{implementacionId}'";
        await foreach (var resource in Subscription.GetGenericResourcesAsync(filter: filter, cancellationToken: cancellationToken))
        {
            try
            {
                await resource.DeleteAsync(WaitUntil.Started, cancellationToken);
            }
            catch (RequestFailedException ex)
            {
                logger.LogWarning(ex, "No se pudo eliminar el recurso {ResourceId}", resource.Id);
            }
        }
    }

    // Finds the primary compute resource for an implementación (tagged
    // 'dds-role: compute') and tries to pause/resume it. Currently wired for
    // Microsoft.Web/sites (Function Apps), which support a simple enabled
    // flag. Other resource types (e.g. Container Apps) are reported back as
    // unsupported rather than guessed at, since a wrong partial-properties
    // PATCH could leave the resource in a broken state.
    public async Task<(bool supported, string? resourceType)> SetComputeEnabledAsync(
        string implementacionId,
        bool enabled,
        CancellationToken cancellationToken = default)
    {
        var filter = $"tagName eq 'dds-implementacion-id' and tagValue eq '{implementacionId}'";
        GenericResource? compute = null;
        await foreach (var resource in Subscription.GetGenericResourcesAsync(filter: filter, cancellationToken: cancellationToken))
        {
            if (string.Equals(resource.Data.ResourceType.ToString(), "Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase))
            {
                compute = resource;
                break;
            }
        }

        if (compute is null)
        {
            return (false, null);
        }

        var current = await compute.GetAsync(cancellationToken);
        var data = new GenericResourceData(current.Value.Data.Location)
        {
            Properties = BinaryData.FromObjectAsJson(new { enabled }),
        };
        await compute.UpdateAsync(WaitUntil.Started, data, cancellationToken);
        return (true, "Microsoft.Web/sites");
    }

    public object BuildKeyVaultReferenceParameter(string secretName) => new
    {
        reference = new
        {
            keyVault = new { id = Options.KeyVaultResourceId },
            secretName,
        },
    };

    private static Dictionary<string, string>? ParseOutputs(BinaryData? outputs)
    {
        if (outputs is null) return null;

        using var doc = System.Text.Json.JsonDocument.Parse(outputs);
        var result = new Dictionary<string, string>();
        foreach (var property in doc.RootElement.EnumerateObject())
        {
            if (property.Value.TryGetProperty("value", out var value))
            {
                result[property.Name] = value.ValueKind == System.Text.Json.JsonValueKind.String
                    ? value.GetString()!
                    : value.GetRawText();
            }
        }

        return result;
    }
}
