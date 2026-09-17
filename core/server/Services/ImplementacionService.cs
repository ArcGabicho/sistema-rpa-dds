using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Server.Data;
using Server.Dtos;
using Server.Models;
using Server.Services.Azure;
using Server.Services.Templates;

namespace Server.Services;

// Orchestrates the implementación lifecycle: validates the request against
// the chosen template, persists it, stores credentials in Key Vault, and
// kicks off the ARM deployment. Status is refreshed lazily whenever a caller
// reads a still-deploying row (GET details/list/logs), which matches the
// frontend's own polling cadence rather than needing a background worker.
public class ImplementacionService(
    AppDbContext db,
    ArmDeploymentService armDeploymentService,
    CredentialVaultService credentialVaultService,
    IOptions<AzureOptions> azureOptions,
    ILogger<ImplementacionService> logger)
{
    private AzureOptions Options => azureOptions.Value;

    public async Task<ImplementacionResponse> DeployAsync(DeployImplementacionRequest request, int adminUserId, CancellationToken ct = default)
    {
        var template = TemplateCatalog.Find(request.TemplateId)
            ?? throw new ImplementacionValidationException($"No existe la plantilla '{request.TemplateId}'.");

        foreach (var param in template.Parameters.Where(p => p.Required))
        {
            if (!request.Config.TryGetValue(param.Name, out var value) || string.IsNullOrWhiteSpace(value))
                throw new ImplementacionValidationException($"Falta el parámetro requerido '{param.Label}'.");
        }

        foreach (var cred in template.Credentials)
        {
            if (!request.Credentials.TryGetValue(cred.Name, out var value) || string.IsNullOrWhiteSpace(value))
                throw new ImplementacionValidationException($"Falta la credencial requerida '{cred.Label}'.");
        }

        var resolvedConfig = template.Parameters.ToDictionary(
            p => p.Name,
            p => request.Config.TryGetValue(p.Name, out var v) && !string.IsNullOrWhiteSpace(v) ? v : (p.DefaultValue ?? ""));

        var entity = new Implementacion
        {
            TemplateId = template.Id,
            Name = request.Name.Trim(),
            Status = ImplementacionStatus.Deploying,
            ConfigJson = JsonSerializer.Serialize(resolvedConfig),
            ResourceGroupName = Options.ResourceGroupName,
            DeploymentName = "pending",
            AdminUserId = adminUserId,
        };

        db.Implementaciones.Add(entity);
        await db.SaveChangesAsync(ct);

        var implementacionKey = entity.Id.ToString();
        entity.DeploymentName = $"impl-{template.Id}-{entity.Id}";
        AddLog(entity, ImplementacionLogLevel.Info, "Implementación creada, iniciando deployment.");
        await db.SaveChangesAsync(ct);

        try
        {
            await armDeploymentService.EnsureResourceGroupAsync(ct);

            var secretNames = await credentialVaultService.SaveCredentialsAsync(implementacionKey, request.Credentials, ct);
            AddLog(entity, ImplementacionLogLevel.Info, "Credenciales guardadas en Key Vault.");

            var parameters = new Dictionary<string, object>
            {
                ["serviceName"] = BuildServiceNameSlug(request.Name, entity.Id),
                ["implementacionId"] = implementacionKey,
            };
            foreach (var (key, value) in resolvedConfig)
                parameters[key] = value;
            foreach (var cred in template.Credentials)
                parameters[cred.Name] = armDeploymentService.BuildKeyVaultReferenceParameter(secretNames[cred.Name]);

            if (template.Id == TemplateCatalog.AiDocumentProcessor)
                parameters["containerAppsEnvironmentName"] = Options.ContainerAppsEnvironmentName;

            var templateJson = await LoadTemplateJsonAsync(template, ct);

            await armDeploymentService.StartDeploymentAsync(entity.DeploymentName, templateJson, parameters, ct);
            AddLog(entity, ImplementacionLogLevel.Info, "Deployment enviado a Azure Resource Manager.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error desplegando la implementación {Id}", entity.Id);
            entity.Status = ImplementacionStatus.Error;
            entity.ErrorMessage = ex.Message;
            AddLog(entity, ImplementacionLogLevel.Error, $"No se pudo iniciar el deployment: {ex.Message}");
        }

        entity.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return ToResponse(entity, template);
    }

    public async Task<PagedImplementacionesResponse> ListAsync(int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = db.Implementaciones.Where(i => i.Status != ImplementacionStatus.Deleted);
        var totalCount = await query.CountAsync(ct);
        var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling(totalCount / (double)pageSize);

        var entities = await query
            .OrderByDescending(i => i.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        foreach (var entity in entities.Where(e => e.Status == ImplementacionStatus.Deploying))
            await RefreshStatusAsync(entity, ct);

        return new PagedImplementacionesResponse
        {
            Items = entities.Select(e => ToResponse(e, TemplateCatalog.Find(e.TemplateId))).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
        };
    }

    public async Task<ImplementacionResponse?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var entity = await db.Implementaciones.FirstOrDefaultAsync(i => i.Id == id && i.Status != ImplementacionStatus.Deleted, ct);
        if (entity is null) return null;

        if (entity.Status == ImplementacionStatus.Deploying)
            await RefreshStatusAsync(entity, ct);

        return ToResponse(entity, TemplateCatalog.Find(entity.TemplateId));
    }

    public async Task<List<ImplementacionLogResponse>?> GetLogsAsync(int id, CancellationToken ct = default)
    {
        var entity = await db.Implementaciones.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (entity is null) return null;

        if (entity.Status == ImplementacionStatus.Deploying)
            await RefreshStatusAsync(entity, ct);

        var logs = await db.ImplementacionLogs
            .Where(l => l.ImplementacionId == id)
            .OrderBy(l => l.TimestampUtc)
            .ToListAsync(ct);

        return logs.Select(l => new ImplementacionLogResponse
        {
            Id = l.Id,
            Level = l.Level,
            Message = l.Message,
            TimestampUtc = l.TimestampUtc,
        }).ToList();
    }

    public async Task<ImplementacionResponse?> SetPauseResumeAsync(int id, string action, CancellationToken ct = default)
    {
        var entity = await db.Implementaciones.FirstOrDefaultAsync(i => i.Id == id && i.Status != ImplementacionStatus.Deleted, ct);
        if (entity is null) return null;

        var resume = action == "resume";
        try
        {
            var (supported, resourceType) = await armDeploymentService.SetComputeEnabledAsync(entity.Id.ToString(), resume, ct);
            entity.Status = resume ? ImplementacionStatus.Running : ImplementacionStatus.Paused;

            if (supported)
            {
                AddLog(entity, ImplementacionLogLevel.Info, resume ? "Servicio reanudado." : "Servicio pausado.");
            }
            else
            {
                AddLog(entity, ImplementacionLogLevel.Warning,
                    $"Estado actualizado a '{entity.Status}', pero la pausa en Azure no está soportada todavía para este tipo de recurso ({resourceType ?? "desconocido"}).");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error actualizando el estado de la implementación {Id}", entity.Id);
            AddLog(entity, ImplementacionLogLevel.Error, $"No se pudo {(resume ? "reanudar" : "pausar")} el servicio: {ex.Message}");
        }

        entity.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return ToResponse(entity, TemplateCatalog.Find(entity.TemplateId));
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await db.Implementaciones.FirstOrDefaultAsync(i => i.Id == id && i.Status != ImplementacionStatus.Deleted, ct);
        if (entity is null) return false;

        var template = TemplateCatalog.Find(entity.TemplateId);
        try
        {
            await armDeploymentService.DeleteTaggedResourcesAsync(entity.Id.ToString(), ct);
            if (template is not null)
                await credentialVaultService.DeleteCredentialsAsync(entity.Id.ToString(), template.Credentials.Select(c => c.Name), ct);
            AddLog(entity, ImplementacionLogLevel.Info, "Recursos eliminados de Azure.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error eliminando la implementación {Id}", entity.Id);
            AddLog(entity, ImplementacionLogLevel.Error, $"No se pudieron eliminar todos los recursos: {ex.Message}");
        }

        entity.Status = ImplementacionStatus.Deleted;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public static List<TemplateResponse> GetTemplates() =>
        TemplateCatalog.All.Select(t => new TemplateResponse
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            Parameters = t.Parameters.Select(p => new TemplateParameterResponse
            {
                Name = p.Name,
                Label = p.Label,
                Type = p.Type,
                Required = p.Required,
                DefaultValue = p.DefaultValue,
                Placeholder = p.Placeholder,
            }).ToList(),
            Credentials = t.Credentials.Select(c => new TemplateCredentialResponse
            {
                Name = c.Name,
                Label = c.Label,
                Placeholder = c.Placeholder,
            }).ToList(),
        }).ToList();

    private async Task RefreshStatusAsync(Implementacion entity, CancellationToken ct)
    {
        try
        {
            var result = await armDeploymentService.GetDeploymentStatusAsync(entity.DeploymentName, ct);
            if (result.Status != entity.Status)
            {
                entity.Status = result.Status;
                if (result.Outputs is not null)
                    entity.OutputsJson = JsonSerializer.Serialize(result.Outputs);
                entity.ErrorMessage = result.ErrorMessage;
                entity.UpdatedAtUtc = DateTime.UtcNow;

                var message = result.Status switch
                {
                    ImplementacionStatus.Running => "Deployment completado. El servicio está corriendo.",
                    ImplementacionStatus.Error => $"El deployment falló: {result.ErrorMessage}",
                    _ => $"Estado actualizado a '{result.Status}'.",
                };
                AddLog(entity, result.Status == ImplementacionStatus.Error ? ImplementacionLogLevel.Error : ImplementacionLogLevel.Info, message);

                await db.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "No se pudo actualizar el estado de la implementación {Id}", entity.Id);
        }
    }

    private void AddLog(Implementacion entity, string level, string message)
    {
        db.ImplementacionLogs.Add(new ImplementacionLog
        {
            ImplementacionId = entity.Id,
            Level = level,
            Message = message,
        });
    }

    private static async Task<string> LoadTemplateJsonAsync(ImplementacionTemplate template, CancellationToken ct)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Templates", template.JsonFileName);
        if (!File.Exists(path))
            throw new InvalidOperationException($"No se encontró la plantilla compilada '{template.JsonFileName}'. Ejecuta scripts/compile-templates.sh.");

        return await File.ReadAllTextAsync(path, ct);
    }

    private static string BuildServiceNameSlug(string name, int id)
    {
        var slug = new string(name.Trim().ToLowerInvariant().Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray());
        while (slug.Contains("--")) slug = slug.Replace("--", "-");
        slug = slug.Trim('-');
        if (slug.Length > 20) slug = slug[..20].Trim('-');
        if (string.IsNullOrEmpty(slug)) slug = "svc";
        return $"{slug}-{id}";
    }

    private static ImplementacionResponse ToResponse(Implementacion entity, ImplementacionTemplate? template) => new()
    {
        Id = entity.Id,
        TemplateId = entity.TemplateId,
        TemplateName = template?.Name ?? entity.TemplateId,
        Name = entity.Name,
        Status = entity.Status,
        Config = JsonSerializer.Deserialize<Dictionary<string, string>>(entity.ConfigJson) ?? [],
        Outputs = entity.OutputsJson is null ? null : JsonSerializer.Deserialize<Dictionary<string, string>>(entity.OutputsJson),
        ErrorMessage = entity.ErrorMessage,
        CreatedAtUtc = entity.CreatedAtUtc,
        UpdatedAtUtc = entity.UpdatedAtUtc,
    };
}
