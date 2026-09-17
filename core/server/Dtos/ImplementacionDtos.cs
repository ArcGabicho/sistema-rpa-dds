using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

public class DeployImplementacionRequest
{
    [Required]
    public required string TemplateId { get; set; }

    [Required, MinLength(2), MaxLength(100)]
    public required string Name { get; set; }

    public Dictionary<string, string> Config { get; set; } = [];
    public Dictionary<string, string> Credentials { get; set; } = [];
}

public class UpdateImplementacionStatusRequest
{
    [Required, RegularExpression("^(pause|resume)$")]
    public required string Action { get; set; }
}

public class ImplementacionResponse
{
    public required int Id { get; set; }
    public required string TemplateId { get; set; }
    public required string TemplateName { get; set; }
    public required string Name { get; set; }
    public required string Status { get; set; }
    public required Dictionary<string, string> Config { get; set; }
    public Dictionary<string, string>? Outputs { get; set; }
    public string? ErrorMessage { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
    public required DateTime UpdatedAtUtc { get; set; }
}

public class ImplementacionLogResponse
{
    public required int Id { get; set; }
    public required string Level { get; set; }
    public required string Message { get; set; }
    public required DateTime TimestampUtc { get; set; }
}

public class PagedImplementacionesResponse
{
    public required List<ImplementacionResponse> Items { get; set; }
    public required int Page { get; set; }
    public required int PageSize { get; set; }
    public required int TotalCount { get; set; }
    public required int TotalPages { get; set; }
}

public class TemplateParameterResponse
{
    public required string Name { get; set; }
    public required string Label { get; set; }
    public required string Type { get; set; }
    public required bool Required { get; set; }
    public string? DefaultValue { get; set; }
    public string? Placeholder { get; set; }
}

public class TemplateCredentialResponse
{
    public required string Name { get; set; }
    public required string Label { get; set; }
    public required string Placeholder { get; set; }
}

public class TemplateResponse
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required List<TemplateParameterResponse> Parameters { get; set; }
    public required List<TemplateCredentialResponse> Credentials { get; set; }
}
