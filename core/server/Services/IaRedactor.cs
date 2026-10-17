using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace Server.Services;

// Drafts a PDD with Claude (Anthropic's Messages API), using structured
// outputs so the answer comes back as JSON in a fixed shape. Configured with
// IA:ApiKey (ANTHROPIC_API_KEY), IA:Modelo and IA:BaseUrl; without a key, AI
// drafting is simply unavailable and PDDs are written by hand.
//
// The draft is only a starting point: it's returned to the editor, where the
// consultant reviews it before saving anything.
public sealed class IaRedactor(HttpClient http, IConfiguration config, ILogger<IaRedactor> logger)
{
    public const string ModeloPorDefecto = "claude-sonnet-5-5";

    private string? ApiKey => config["IA:ApiKey"] is { Length: > 0 } key ? key : null;
    public bool Configurada => ApiKey is not null;
    public string Modelo => config["IA:Modelo"] is { Length: > 0 } m ? m : ModeloPorDefecto;

    public sealed record ContextoPdd(
        string Empresa,
        string? Rubro,
        string Proceso,
        string? Area,
        string Servicio,
        string? ComoSeHaceHoy,
        int? EjecucionesMes,
        decimal? MinutosPorEjecucion,
        int? Personas,
        decimal? TasaError,
        string? Notas,
        IReadOnlyDictionary<string, string> PddActual);

    public sealed class Excepcion
    {
        [JsonPropertyName("caso")] public string Caso { get; set; } = "";
        [JsonPropertyName("tratamiento")] public string Tratamiento { get; set; } = "";
    }

    public sealed class BorradorPdd
    {
        [JsonPropertyName("objetivo")] public string Objetivo { get; set; } = "";
        [JsonPropertyName("alcance")] public string Alcance { get; set; } = "";
        [JsonPropertyName("sistemas")] public List<string> Sistemas { get; set; } = [];
        [JsonPropertyName("entradas")] public List<string> Entradas { get; set; } = [];
        [JsonPropertyName("salidas")] public List<string> Salidas { get; set; } = [];
        [JsonPropertyName("pasos_actuales")] public List<string> PasosActuales { get; set; } = [];
        [JsonPropertyName("reglas_negocio")] public List<string> Reglas { get; set; } = [];
        [JsonPropertyName("excepciones")] public List<Excepcion> Excepciones { get; set; } = [];
        [JsonPropertyName("pasos_propuestos")] public List<string> PasosPropuestos { get; set; } = [];
        [JsonPropertyName("preguntas_abiertas")] public List<string> Preguntas { get; set; } = [];
    }

    // Raised with a message the panel can show as is.
    public sealed class IaException(string message) : Exception(message);

    private const string Sistema = """
        Eres analista de procesos en Data Discovery Solutions (DDS), una consultora peruana que automatiza procesos con RPA, inteligencia artificial y analítica de datos.
        Redactas el PDD (Process Definition Document) de un proceso a partir de lo que levantó el consultor con el cliente. El PDD describe cómo se hace el proceso hoy y cómo lo hará la automatización; el cliente lo revisa y lo aprueba antes del desarrollo.

        Reglas:
        - Escribe en español profesional y claro, en frases cortas. Nada de relleno ni frases de marketing.
        - Usa solo la información que te dan. No inventes nombres de sistemas, pantallas, campos, cifras, plazos ni reglas que no estén en los datos.
        - Si falta algo que un PDD necesita (un sistema, un umbral, quién aprueba, qué pasa en un caso), no lo supongas: formúlalo como pregunta para el cliente en "preguntas_abiertas".
        - Cada paso es una acción concreta: quién o qué la hace, sobre qué, y en qué sistema si se sabe. Los pasos van en orden.
        - En "pasos_propuestos" describe lo que hará la solución de DDS y en qué momentos interviene una persona.
        - Si ya hay texto en el PDD actual, consérvalo y compleméntalo: no lo contradigas salvo que las notas digan otra cosa.
        """;

    private static readonly JsonObject Esquema = JsonNode.Parse("""
        {
          "type": "object",
          "properties": {
            "objetivo": { "type": "string", "description": "Qué busca la automatización y para quién, en 2 o 3 frases." },
            "alcance": { "type": "string", "description": "Qué cubre y qué no cubre la automatización." },
            "sistemas": { "type": "array", "items": { "type": "string" }, "description": "Aplicaciones y sistemas que intervienen, solo los mencionados en los datos." },
            "entradas": { "type": "array", "items": { "type": "string" }, "description": "Información o archivos que inician o alimentan el proceso." },
            "salidas": { "type": "array", "items": { "type": "string" }, "description": "Resultados que produce el proceso." },
            "pasos_actuales": { "type": "array", "items": { "type": "string" }, "description": "El proceso como se hace hoy (AS-IS), un paso por elemento, en orden." },
            "reglas_negocio": { "type": "array", "items": { "type": "string" }, "description": "Reglas y criterios de decisión del proceso." },
            "excepciones": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "caso": { "type": "string", "description": "La situación fuera del camino normal." },
                  "tratamiento": { "type": "string", "description": "Qué se hace en ese caso." }
                },
                "required": ["caso", "tratamiento"],
                "additionalProperties": false
              }
            },
            "pasos_propuestos": { "type": "array", "items": { "type": "string" }, "description": "El proceso automatizado (TO-BE), un paso por elemento, en orden." },
            "preguntas_abiertas": { "type": "array", "items": { "type": "string" }, "description": "Lo que falta confirmar con el cliente para cerrar el PDD." }
          },
          "required": ["objetivo", "alcance", "sistemas", "entradas", "salidas", "pasos_actuales", "reglas_negocio", "excepciones", "pasos_propuestos", "preguntas_abiertas"],
          "additionalProperties": false
        }
        """)!.AsObject();

    public async Task<BorradorPdd> RedactarPddAsync(ContextoPdd c, CancellationToken ct)
    {
        if (ApiKey is not { } apiKey)
            throw new IaException("La redacción con IA no está configurada: falta ANTHROPIC_API_KEY en el servidor.");

        var cuerpo = new JsonObject
        {
            ["model"] = Modelo,
            ["max_tokens"] = config.GetValue("IA:MaxTokens", 4000),
            ["system"] = Sistema,
            ["messages"] = new JsonArray(new JsonObject { ["role"] = "user", ["content"] = Prompt(c) }),
            ["output_config"] = new JsonObject
            {
                ["format"] = new JsonObject { ["type"] = "json_schema", ["schema"] = Esquema.DeepClone() },
            },
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "v1/messages") { Content = JsonContent.Create(cuerpo) };
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");

        HttpResponseMessage response;
        try
        {
            response = await http.SendAsync(request, ct);
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            throw new IaException("La IA tardó demasiado en responder. Intenta de nuevo.");
        }
        catch (HttpRequestException e)
        {
            logger.LogWarning(e, "No se pudo conectar con la API de IA");
            throw new IaException("No se pudo conectar con el servicio de IA.");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var detalle = await response.Content.ReadAsStringAsync(ct);
                logger.LogWarning("La API de IA respondió {Status}: {Detalle}", (int)response.StatusCode, detalle.Length > 500 ? detalle[..500] : detalle);
                throw new IaException(response.StatusCode switch
                {
                    HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden => "La API key de IA no es válida o no tiene permisos.",
                    HttpStatusCode.TooManyRequests or (HttpStatusCode)529 => "El servicio de IA está saturado en este momento. Intenta en un minuto.",
                    _ => "El servicio de IA no pudo redactar el PDD. Intenta de nuevo.",
                });
            }

            using var json = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var raiz = json.RootElement;
            var stop = raiz.TryGetProperty("stop_reason", out var s) ? s.GetString() : null;
            if (stop == "refusal") throw new IaException("La IA no quiso redactar este PDD. Revisa las notas y vuelve a intentarlo.");
            if (stop == "max_tokens") throw new IaException("El borrador salió demasiado largo y se cortó. Resume las notas e intenta de nuevo.");

            var texto = raiz.GetProperty("content").EnumerateArray()
                .Where(b => b.GetProperty("type").GetString() == "text")
                .Select(b => b.GetProperty("text").GetString())
                .FirstOrDefault();
            if (raiz.TryGetProperty("usage", out var uso))
                logger.LogInformation("PDD redactado con {Modelo}: {Uso}", Modelo, uso.GetRawText());

            try
            {
                return JsonSerializer.Deserialize<BorradorPdd>(texto ?? "")
                    ?? throw new IaException("La IA respondió vacío. Intenta de nuevo.");
            }
            catch (JsonException)
            {
                throw new IaException("La respuesta de la IA no tenía el formato esperado. Intenta de nuevo.");
            }
        }
    }

    private static string Prompt(ContextoPdd c)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Empresa: {c.Empresa}{(c.Rubro is null ? "" : $" (rubro: {c.Rubro})")}");
        sb.AppendLine($"Proceso: {c.Proceso}{(c.Area is null ? "" : $" — área de {c.Area}")}");
        sb.AppendLine($"Solución prevista: {c.Servicio}");
        if (c.EjecucionesMes is not null)
            sb.AppendLine($"Volumen según el diagnóstico: {c.EjecucionesMes} veces al mes, {c.MinutosPorEjecucion} minutos cada vez, {c.Personas} personas, {c.TasaError} % de error.");
        if (!string.IsNullOrWhiteSpace(c.ComoSeHaceHoy)) sb.AppendLine($"Cómo se hace hoy (del diagnóstico): {c.ComoSeHaceHoy}");
        sb.AppendLine();
        sb.AppendLine("Notas del levantamiento:");
        sb.AppendLine(string.IsNullOrWhiteSpace(c.Notas) ? "(sin notas)" : c.Notas.Trim());
        if (c.PddActual.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("PDD actual (consérvalo y compleméntalo):");
            foreach (var (seccion, texto) in c.PddActual) sb.AppendLine($"[{seccion}]\n{texto}");
        }
        sb.AppendLine();
        sb.AppendLine("Redacta el PDD de este proceso.");
        return sb.ToString();
    }
}
