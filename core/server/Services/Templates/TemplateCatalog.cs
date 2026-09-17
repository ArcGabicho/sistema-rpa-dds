namespace Server.Services.Templates;

public record TemplateParameterDef(
    string Name,
    string Label,
    string Type,
    bool Required,
    string? DefaultValue = null,
    string? Placeholder = null
);

public record TemplateCredentialDef(
    string Name,
    string Label,
    string Placeholder
);

public record ImplementacionTemplate(
    string Id,
    string Name,
    string Description,
    string JsonFileName,
    IReadOnlyList<TemplateParameterDef> Parameters,
    IReadOnlyList<TemplateCredentialDef> Credentials
);

public static class TemplateCatalog
{
    public const string RpaWebScraping = "rpa-web-scraping";
    public const string AiDocumentProcessor = "ai-document-processor";
    public const string DataSyncEtl = "data-sync-etl";

    public static readonly IReadOnlyList<ImplementacionTemplate> All =
    [
        new ImplementacionTemplate(
            Id: RpaWebScraping,
            Name: "RPA Web Scraping",
            Description: "Extrae datos de una página web en un horario programado.",
            JsonFileName: "rpa-web-scraping.json",
            Parameters:
            [
                new("targetUrl", "URL objetivo", "url", Required: true, Placeholder: "https://ejemplo.com/catalogo"),
                new("scheduleCron", "Frecuencia (CRON)", "cron", Required: false, DefaultValue: "0 0 * * * *", Placeholder: "0 0 * * * *"),
            ],
            Credentials:
            [
                new("browserDriverKey", "API key del driver de navegador", "sk-..."),
            ]
        ),
        new ImplementacionTemplate(
            Id: AiDocumentProcessor,
            Name: "IA Document Processor",
            Description: "Procesa documentos subidos a un contenedor de almacenamiento usando un modelo de IA.",
            JsonFileName: "ai-document-processor.json",
            Parameters:
            [
                new("storageContainer", "Contenedor de documentos", "string", Required: false, DefaultValue: "documents"),
                new("model", "Modelo de IA", "string", Required: false, DefaultValue: "gpt-4o-mini"),
            ],
            Credentials:
            [
                new("openaiKey", "API key de OpenAI / Azure OpenAI", "sk-..."),
            ]
        ),
        new ImplementacionTemplate(
            Id: DataSyncEtl,
            Name: "ETL Data Sync",
            Description: "Sincroniza datos entre dos bases de datos en un horario programado.",
            JsonFileName: "data-sync-etl.json",
            Parameters:
            [
                new("scheduleCron", "Frecuencia (CRON)", "cron", Required: false, DefaultValue: "0 0 * * * *", Placeholder: "0 0 * * * *"),
            ],
            Credentials:
            [
                new("sourceConnectionString", "Cadena de conexión de origen", "Server=...;Database=...;"),
                new("targetConnectionString", "Cadena de conexión de destino", "Server=...;Database=...;"),
            ]
        ),
    ];

    public static ImplementacionTemplate? Find(string id) =>
        All.FirstOrDefault(t => t.Id == id);
}
