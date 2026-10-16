namespace Server.Dtos;

public class PagedResponse<T>
{
    public required List<T> Items { get; set; }
    public required int Page { get; set; }
    public required int PageSize { get; set; }
    public required int TotalCount { get; set; }
    public required int TotalPages { get; set; }

    public static PagedResponse<T> Create(List<T> items, int page, int pageSize, int totalCount) => new()
    {
        Items = items,
        Page = page,
        PageSize = pageSize,
        TotalCount = totalCount,
        TotalPages = totalCount == 0 ? 1 : (int)Math.Ceiling(totalCount / (double)pageSize),
    };
}
