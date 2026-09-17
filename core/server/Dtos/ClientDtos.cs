using System.ComponentModel.DataAnnotations;

namespace Server.Dtos;

public class CreateClientRequest
{
    [Required, MinLength(2), MaxLength(200)]
    public required string FullName { get; set; }

    [Required, EmailAddress, MaxLength(256)]
    public required string Email { get; set; }

    [Required, MinLength(6), MaxLength(30)]
    public required string Phone { get; set; }

    [Required, RegularExpression("^(analitica|rpa|ia)$")]
    public required string Service { get; set; }

    [Required, MinLength(10), MaxLength(600)]
    public required string Message { get; set; }
}

public class ClientResponse
{
    public required int Id { get; set; }
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public required string Service { get; set; }
    public required string Message { get; set; }
    public required string Status { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
}

public class UpdateClientRequest
{
    [Required]
    public required string Status { get; set; }

    public int? AssignedToUserId { get; set; }
}

public class CreateClientNoteRequest
{
    [Required, MinLength(1), MaxLength(1000)]
    public required string Message { get; set; }
}

public class ClientNoteResponse
{
    public required int Id { get; set; }
    public required string Message { get; set; }
    public required string AuthorName { get; set; }
    public required DateTime CreatedAtUtc { get; set; }
}

public class PagedClientsResponse
{
    public required List<ClientResponse> Items { get; set; }
    public required int Page { get; set; }
    public required int PageSize { get; set; }
    public required int TotalCount { get; set; }
    public required int TotalPages { get; set; }
}
