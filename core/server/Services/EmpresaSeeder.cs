using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services;

// Demo prospect base for local development (Seed:DatosDemo): 4,018 fictitious
// companies of the kind that buys automation from DDS (banks, retail, mining,
// logistics, manufacturing…), with their contacts and a small sales pipeline
// so the board and the summary have something to show.
//
// Generated from a fixed seed, so it's always the same data (only the dates
// move with today). No name, RUC, email or phone belongs to a real company
// or person: emails and websites use the reserved ".example" domain, and the
// RUCs are random numbers with a valid check digit.
public static class EmpresaSeeder
{
    private const int Total = 4018;
    private const int Semilla = 20261016;
    private const int Lote = 500;

    public static async Task SeedAsync(AppDbContext db, IConfiguration config, ILogger logger, CancellationToken ct = default)
    {
        if (!config.GetValue<bool>("Seed:DatosDemo")) return;
        if (await db.Empresas.AnyAsync(ct)) return;

        // Pipeline activity needs an author; without users, only companies.
        var autorId = await db.AdminUsers.OrderBy(u => u.Id).Select(u => (int?)u.Id).FirstOrDefaultAsync(ct);

        var gen = new Generador(new Random(Semilla), DateTime.UtcNow, Lima.Hoy, autorId);
        var empresas = Enumerable.Range(0, Total).Select(_ => gen.Empresa()).ToList();

        for (var i = 0; i < empresas.Count; i += Lote)
        {
            db.Empresas.AddRange(empresas.GetRange(i, Math.Min(Lote, empresas.Count - i)));
            await db.SaveChangesAsync(ct);
            db.ChangeTracker.Clear();
        }

        logger.LogInformation(
            "Datos demo: {Empresas} empresas, {Contactos} contactos y {Oportunidades} oportunidades.",
            empresas.Count,
            empresas.Sum(e => e.Contactos.Count),
            empresas.Sum(e => e.Oportunidades.Count));
    }

    private sealed class Generador(Random rnd, DateTime ahora, DateTime hoy, int? autorId)
    {
        private readonly HashSet<string> nombres = [];
        private readonly HashSet<string> rucs = [];

        public Empresa Empresa()
        {
            var sector = Pesado(Sectores);
            var nombre = NombreUnico(sector);
            var dominio = $"{Slug(nombre)}.example";
            var (distrito, provincia, enLima) = Ubicacion();
            var creada = ahora.AddDays(-rnd.Next(1, 3 * 365)).AddMinutes(-rnd.Next(0, 1440));

            var empresa = new Empresa
            {
                NombreComercial = nombre,
                RazonSocial = Prob(0.85) ? $"{nombre.ToUpperInvariant()} {Pick(Sociedades)}" : null,
                Ruc = Prob(0.80) ? RucUnico() : null,
                Rubro = Prob(0.88) ? sector.Rubro : null,
                SitioWeb = Prob(0.60) ? $"www.{dominio}" : null,
                Direccion = Prob(0.60) ? Direccion(enLima) : null,
                Distrito = Prob(0.85) ? distrito : null,
                Provincia = Prob(0.92) ? provincia : null,
                Estado = Prob(0.04) ? EmpresaEstado.Inactiva : EmpresaEstado.Prospecto,
                Origen = Pesado(Origenes),
                CreatedAtUtc = creada,
                UpdatedAtUtc = creada,
            };

            var contactos = Pesado(new[] { (0, 8), (1, 67), (2, 20), (3, 5) });
            for (var i = 0; i < contactos; i++) empresa.Contactos.Add(Contacto(dominio, enLima, creada));

            // About 6% of the active companies are in conversations with DDS.
            if (autorId is not null && empresa.Estado != EmpresaEstado.Inactiva && Prob(0.06))
            {
                empresa.ResponsableId = autorId;
                var oportunidades = Prob(0.15) ? 2 : 1;
                for (var i = 0; i < oportunidades; i++) empresa.Oportunidades.Add(Oportunidad(empresa));

                if (empresa.Oportunidades.Any(o => o.Etapa == OportunidadEtapa.Ganada))
                    empresa.Estado = EmpresaEstado.Cliente;
                empresa.UpdatedAtUtc = empresa.Oportunidades.Max(o => o.UpdatedAtUtc);
            }

            return empresa;
        }

        private Contacto Contacto(string dominio, bool enLima, DateTime creada)
        {
            var nombre = Pick(Nombres);
            var paterno = Pick(Apellidos);
            var materno = Pick(Apellidos);
            while (materno == paterno) materno = Pick(Apellidos);
            return new Contacto
            {
                Nombres = nombre,
                Apellidos = $"{paterno} {materno}",
                Cargo = Prob(0.85) ? Pesado(Cargos) : null,
                Email = Prob(0.70) ? $"{Slug(nombre)}.{Slug(paterno)}@{dominio}" : null,
                Telefono = Prob(0.60) ? Telefono(enLima) : null,
                CreatedAtUtc = creada,
            };
        }

        // An opportunity with a history that matches its stage: created, moved
        // through each stage up to the current one (or closed), with calls,
        // meetings and emails in between, and a next step while it's open.
        private Oportunidad Oportunidad(Empresa empresa)
        {
            var servicio = Pesado(new[] { (ServicioTipo.Rpa, 50), (ServicioTipo.Ia, 30), (ServicioTipo.Analitica, 20) });
            var etapa = Pesado(EtapasDemo);
            var abierta = OportunidadEtapa.Abiertas.Contains(etapa);
            var (minimo, maximo) = Rangos[servicio];

            var desde = Max(empresa.CreatedAtUtc, ahora.AddDays(-300));
            var creada = desde.AddDays(rnd.NextDouble() * (ahora - desde).TotalDays * 0.7);
            // Closed deals took 20 to 120 days; one that would close in the
            // future closed recently instead, spread over the last weeks.
            var cierre = creada.AddDays(rnd.Next(20, 120));
            if (cierre > ahora.AddDays(-1)) cierre = ahora.AddDays(-rnd.Next(1, 60));
            var ultima = abierta
                ? Max(creada.AddHours(2), ahora.AddDays(-rnd.Next(0, 20)))
                : Max(creada.AddHours(2), cierre);

            var oportunidad = new Oportunidad
            {
                Empresa = empresa,
                Contacto = empresa.Contactos.Count > 0 ? empresa.Contactos[0] : null,
                Titulo = Pick(Titulos[servicio]),
                Servicio = servicio,
                Etapa = etapa,
                ValorEstimado = etapa == OportunidadEtapa.Nuevo && Prob(0.4) ? null : rnd.Next(minimo / 500, maximo / 500) * 500m,
                FechaCierreEstimada = abierta ? hoy.AddDays(rnd.Next(15, 150)) : ultima.Date,
                ResponsableId = autorId,
                MotivoPerdida = etapa == OportunidadEtapa.Perdida ? Pick(MotivosPerdida) : null,
                CerradaAtUtc = abierta ? null : ultima,
                CreatedAtUtc = creada,
            };

            if (abierta && Prob(0.88))
            {
                oportunidad.ProximaAccion = Pick(ProximasAcciones[etapa]);
                oportunidad.ProximaAccionFecha = hoy.AddDays(rnd.Next(-10, 22));
            }

            // Stages walked through: up to the current one, or up to where it
            // was lost, then the close.
            string[] recorrido = etapa switch
            {
                OportunidadEtapa.Ganada => [.. OportunidadEtapa.Abiertas, OportunidadEtapa.Ganada],
                OportunidadEtapa.Perdida => [.. OportunidadEtapa.Abiertas.Take(rnd.Next(1, 5)), OportunidadEtapa.Perdida],
                _ => OportunidadEtapa.Abiertas.TakeWhile(e => e != etapa).Append(etapa).ToArray(),
            };

            var eventos = new List<(string Tipo, string Descripcion)>
            {
                (ActividadTipo.Nota, $"Oportunidad creada en la etapa {OportunidadEtapa.Label(OportunidadEtapa.Nuevo)}."),
            };
            for (var i = 1; i < recorrido.Length; i++)
            {
                // Something happened in each stage before moving on from it.
                if (Prob(0.7)) eventos.Add(Pick(Actividades[recorrido[i - 1]]));
                var cambio = $"Etapa: {OportunidadEtapa.Label(recorrido[i - 1])} → {OportunidadEtapa.Label(recorrido[i])}.";
                if (recorrido[i] == OportunidadEtapa.Perdida) cambio += $" Motivo: {oportunidad.MotivoPerdida}";
                eventos.Add((ActividadTipo.CambioEtapa, cambio));
            }
            if (abierta && Prob(0.6)) eventos.Add(Pick(Actividades[etapa]));

            // Spread the events from creation to the last touch, in order.
            var paso = (ultima - creada) / Math.Max(1, eventos.Count - 1);
            for (var i = 0; i < eventos.Count; i++)
            {
                oportunidad.Actividades.Add(new Actividad
                {
                    Empresa = empresa,
                    Tipo = eventos[i].Tipo,
                    Descripcion = eventos[i].Descripcion,
                    AutorId = autorId!.Value,
                    // A little jitter, never enough to reorder two events.
                    CreatedAtUtc = creada + paso * i - TimeSpan.FromMinutes(i == 0 ? 0 : rnd.NextDouble() * Math.Min(90, paso.TotalMinutes / 3)),
                });
            }
            oportunidad.UpdatedAtUtc = oportunidad.Actividades[^1].CreatedAtUtc;
            return oportunidad;
        }

        // --- Generators ----------------------------------------------------------

        private string NombreUnico(Sector sector)
        {
            for (var intento = 0; intento < 50; intento++)
            {
                var nombre = Pesado(new[] { (0, 30), (1, 25), (2, 5), (3, 25), (4, 15) }) switch
                {
                    0 => $"{Pick(Prefijos)} {Pick(sector.Giros)}",
                    1 => $"{Pick(sector.Giros)} {Pick(Apellidos)}",
                    2 => $"Grupo {Pick(Prefijos)}",
                    3 => $"{Pick(sector.Giros)} {Pick(Apellidos)} & {Pick(Apellidos)}",
                    _ => $"{Pick(PrefijosSimples)}{Pick(Sufijos)}",
                };
                if (nombres.Add(nombre)) return nombre;
            }
            var respaldo = $"{Pick(sector.Giros)} {Pick(Prefijos)} {nombres.Count}";
            nombres.Add(respaldo);
            return respaldo;
        }

        private string RucUnico()
        {
            while (true)
            {
                var base10 = $"20{rnd.Next(10_000_000, 99_999_999)}";
                var ruc = $"{base10}{Ruc.CheckDigit(base10)}";
                if (rucs.Add(ruc)) return ruc;
            }
        }

        private (string Distrito, string Provincia, bool EnLima) Ubicacion()
        {
            if (Prob(0.82))
            {
                var distrito = Pesado(DistritosLima);
                return (distrito, distrito == "Callao" ? "Callao" : "Lima", true);
            }
            var ciudad = Pesado(Ciudades);
            return (ciudad, ciudad, false);
        }

        private string Direccion(bool enLima)
        {
            var via = $"{Pick(enLima ? ViasLima : ViasProvincia)} {rnd.Next(100, 3999)}";
            return Prob(0.25) ? $"{via}, Of. {rnd.Next(2, 18)}0{rnd.Next(1, 9)}" : via;
        }

        private string Telefono(bool enLima) => !enLima || Prob(0.7)
            ? $"9{rnd.Next(10, 99)} {rnd.Next(100, 999)} {rnd.Next(100, 999)}"
            : $"(01) {rnd.Next(200, 799)} {rnd.Next(1000, 9999)}";

        private bool Prob(double p) => rnd.NextDouble() < p;

        private T Pick<T>(T[] items) => items[rnd.Next(items.Length)];

        private T Pesado<T>((T Valor, int Peso)[] items)
        {
            var r = rnd.Next(items.Sum(x => x.Peso));
            foreach (var (valor, peso) in items)
            {
                if ((r -= peso) < 0) return valor;
            }
            return items[^1].Valor;
        }

        private static DateTime Max(DateTime a, DateTime b) => a > b ? a : b;
        private static DateTime Min(DateTime a, DateTime b) => a < b ? a : b;

        // "Logística Ñan & Cóndor" -> "logisticanancondor"
        private static string Slug(string s)
        {
            var sb = new StringBuilder();
            foreach (var ch in s.Normalize(NormalizationForm.FormD))
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark) continue;
                if (char.IsAsciiLetterOrDigit(ch)) sb.Append(char.ToLowerInvariant(ch));
            }
            return sb.ToString();
        }
    }

    // --- Fictitious catalogs ---------------------------------------------------

    // Each sector: the rubro shown on the company, its share of the base, and
    // the trade words its company names use ("Transportes", "Minera"…).
    private sealed record Sector(string Rubro, string[] Giros);

    private static readonly (Sector, int)[] Sectores =
    [
        (new("Comercio mayorista", ["Distribuidora", "Importaciones", "Comercializadora"]), 230),
        (new("Logística y transporte", ["Logística", "Transportes", "Cargo", "Courier"]), 230),
        (new("Manufactura", ["Industrias", "Plásticos", "Metalmecánica", "Textil", "Envases"]), 260),
        (new("Construcción", ["Constructora", "Ingeniería", "Edificaciones"]), 210),
        (new("Minería", ["Minera", "Exploraciones", "Servicios Mineros"]), 190),
        (new("Servicios profesionales", ["Consultores", "Asesores", "Estudio Contable", "Servicios Generales"]), 180),
        (new("Retail", ["Tiendas", "Market", "Comercial"]), 160),
        (new("Alimentos y bebidas", ["Alimentos", "Bebidas", "Lácteos", "Panificadora"]), 160),
        (new("Salud", ["Clínica", "Laboratorios", "Farma", "Policlínico"]), 150),
        (new("Agroindustria", ["Agroindustrial", "Agroexportadora", "Agrícola", "Frutos"]), 140),
        (new("Educación", ["Instituto", "Colegio", "Escuela de Negocios"]), 130),
        (new("Banca y finanzas", ["Financiera", "Capital", "Créditos", "Cooperativa"]), 120),
        (new("Automotriz", ["Automotriz", "Motors", "Autopartes"]), 120),
        (new("Tecnología", ["Tecnologías", "Software", "Sistemas"]), 110),
        (new("Inmobiliaria", ["Inmobiliaria", "Desarrollos"]), 90),
        (new("Energía", ["Energía", "Eléctrica", "Gas"]), 80),
        (new("Telecomunicaciones", ["Telecom", "Redes", "Conectividad"]), 60),
        (new("Seguros", ["Seguros", "Corredores de Seguros"]), 50),
        (new("Pesca", ["Pesquera", "Conservas"]), 50),
    ];

    // Quechua words and Andean places: Peruvian-sounding, and kept clear of
    // the names of well-known Peruvian companies.
    private static readonly string[] Prefijos =
    [
        "Sumaq", "Qori", "Yaku", "Killa", "Ayni", "Taypi", "Urpi", "Antara", "Kusi", "Pirka", "Ñan", "Hatun",
        "Raymi", "Tika", "Sacha", "Allpa", "Qhapaq", "Huaylas", "Vilcas", "Cóndor", "Vicuña", "Huascarán",
        "Paracas", "Nazca", "Moche", "Chavín", "Tumbes", "Nexo", "Vértice", "Cumbre", "Altiplano", "Litoral",
        "Horizonte", "Cordillera", "Puna", "Costa Sur", "Valle Alto", "Selva Central", "Lomas", "Huarango",
    ];

    // One-word prefixes, for names glued to a suffix ("Sumaqtec").
    private static readonly string[] PrefijosSimples = Prefijos.Where(p => !p.Contains(' ')).ToArray();

    private static readonly string[] Sufijos = ["tec", " Group", " Partners", "corp", " Solutions", "net", " Perú", " Andina"];

    private static readonly string[] Sociedades = ["S.A.C.", "S.A.C.", "S.A.C.", "S.A.", "E.I.R.L.", "S.R.L."];

    private static readonly string[] Nombres =
    [
        "Ana", "Luis", "María", "Carlos", "Rosa", "Jorge", "Lucía", "Miguel", "Carmen", "José", "Patricia", "Juan",
        "Sofía", "Ricardo", "Elena", "Fernando", "Gabriela", "Víctor", "Daniela", "Andrés", "Valeria", "Raúl",
        "Claudia", "Diego", "Paola", "Alberto", "Karina", "Óscar", "Milagros", "Sergio", "Lorena", "Hugo",
        "Fiorella", "Renzo", "Mariana", "César", "Giuliana", "Martín", "Rocío", "Gustavo",
    ];

    private static readonly string[] Apellidos =
    [
        "Quispe", "Flores", "Rojas", "Mamani", "Huamán", "García", "Sánchez", "Torres", "Ramírez", "Castillo",
        "Mendoza", "Vargas", "Chávez", "Ruiz", "Gutiérrez", "Paredes", "Salazar", "Cárdenas", "Vega", "Ríos",
        "Silva", "Medina", "Aguilar", "Herrera", "Espinoza", "Guerrero", "Rivera", "Cruz", "Navarro", "Campos",
        "Ccori", "Condori", "Valdivia", "Zegarra", "Benavides", "Del Carpio", "Tapia", "Arias", "Palomino", "Lozano",
    ];

    // Who DDS sells to: the owners of manual, repetitive processes and the
    // people who approve the budget.
    private static readonly (string, int)[] Cargos =
    [
        ("Gerente de TI", 170), ("Gerente General", 160), ("Gerente de Operaciones", 150), ("Jefe de Sistemas", 150),
        ("Gerente de Finanzas", 140), ("Jefe de Contabilidad", 130), ("Jefe de Logística", 110),
        ("Gerente de Administración", 110), ("Gerente Comercial", 100), ("Jefe de Procesos", 90),
        ("Gerente de Recursos Humanos", 90), ("Jefe de Compras", 80), ("Jefe de Transformación Digital", 70),
        ("Analista de BI", 50), ("Jefe de Atención al Cliente", 50), ("Jefe de Innovación", 40),
        ("Controller Financiero", 40), ("Coordinador de Mejora Continua", 40),
    ];

    private static readonly (string, int)[] Origenes =
    [
        ("Base de prospectos", 520), ("LinkedIn", 140), ("Referido", 110), ("Llamada en frío", 90),
        ("Formulario web", 70), ("Webinar DDS", 60), ("Cámara de Comercio de Lima", 40), ("PERUMIN 2023", 30),
        ("Alianza con partner", 30), ("EXPOMINA 2024", 25),
    ];

    private static readonly (string, int)[] DistritosLima =
    [
        ("San Isidro", 600), ("Santiago de Surco", 400), ("Miraflores", 380), ("Lima", 280), ("Callao", 240),
        ("Ate", 230), ("San Borja", 160), ("La Victoria", 150), ("La Molina", 120), ("Chorrillos", 120),
        ("Surquillo", 110), ("Jesús María", 100), ("Lurín", 90), ("San Miguel", 90), ("Magdalena del Mar", 80),
        ("Los Olivos", 70), ("San Juan de Lurigancho", 70), ("Independencia", 60), ("Lince", 60),
        ("San Martín de Porres", 60), ("Santa Anita", 50), ("Villa El Salvador", 50),
    ];

    private static readonly (string, int)[] Ciudades =
    [
        ("Arequipa", 30), ("Trujillo", 22), ("Piura", 16), ("Chiclayo", 14), ("Ica", 10), ("Cusco", 10),
        ("Huancayo", 8), ("Cajamarca", 6), ("Tacna", 5), ("Moquegua", 4),
    ];

    private static readonly string[] ViasLima =
    [
        "Av. Javier Prado Este", "Av. Larco", "Av. Benavides", "Av. Arequipa", "Av. La Marina", "Av. Primavera",
        "Av. Brasil", "Calle Los Pinos", "Av. Angamos Oeste", "Av. Universitaria", "Av. Petit Thouars",
        "Calle Las Begonias", "Av. El Derby", "Av. Separadora Industrial", "Av. República de Panamá",
        "Av. Nicolás Arriola",
    ];

    private static readonly string[] ViasProvincia =
        ["Av. Ejército", "Av. España", "Av. Grau", "Jr. Lima", "Calle Mercaderes", "Av. Los Incas", "Av. Bolognesi"];

    private static readonly (string, int)[] EtapasDemo =
    [
        (OportunidadEtapa.Nuevo, 22), (OportunidadEtapa.Contactado, 24), (OportunidadEtapa.Diagnostico, 16),
        (OportunidadEtapa.Propuesta, 12), (OportunidadEtapa.Negociacion, 6), (OportunidadEtapa.Ganada, 11),
        (OportunidadEtapa.Perdida, 9),
    ];

    // Deal size in soles by service.
    private static readonly Dictionary<string, (int Minimo, int Maximo)> Rangos = new()
    {
        [ServicioTipo.Rpa] = (18_000, 140_000),
        [ServicioTipo.Ia] = (25_000, 220_000),
        [ServicioTipo.Analitica] = (12_000, 110_000),
    };

    private static readonly Dictionary<string, string[]> Titulos = new()
    {
        [ServicioTipo.Rpa] =
        [
            "Automatizar la conciliación bancaria diaria", "Bot de emisión de facturas electrónicas",
            "Automatizar altas y bajas de planilla", "Carga automática de órdenes de compra en el ERP",
            "Bot de cobranza y envío de estados de cuenta", "Automatizar el cierre contable mensual",
            "Descarga y registro de comprobantes de SUNAT", "Bot de conciliación de cuentas por pagar",
            "Automatizar reportes regulatorios", "Registro automático de guías de remisión",
        ],
        [ServicioTipo.Ia] =
        [
            "Lectura de facturas con IA", "Asistente virtual para atención al cliente",
            "Clasificación automática de correos entrantes", "Revisión de contratos con IA",
            "Asistente interno para consultas de RR.HH.", "Extracción de datos de documentos escaneados",
            "Chatbot de seguimiento de pedidos", "Resumen automático de reclamos",
        ],
        [ServicioTipo.Analitica] =
        [
            "Tablero de ventas en Power BI", "Pronóstico de demanda", "Tablero de indicadores de operaciones",
            "Modelo de riesgo de cobranza", "Data warehouse de ventas y finanzas", "Tablero de rotación de inventario",
            "Análisis de rentabilidad por cliente",
        ],
    };

    private static readonly Dictionary<string, string[]> ProximasAcciones = new()
    {
        [OportunidadEtapa.Nuevo] =
        [
            "Llamar para presentar a DDS", "Enviar correo de presentación con casos de uso",
            "Conectar por LinkedIn con el área de TI",
        ],
        [OportunidadEtapa.Contactado] =
        [
            "Agendar reunión de descubrimiento", "Enviar ejemplos de automatización del sector",
            "Confirmar quién decide la compra",
        ],
        [OportunidadEtapa.Diagnostico] =
        [
            "Levantar el proceso AS-IS en sitio", "Pedir volúmenes y tiempos actuales del proceso",
            "Presentar los hallazgos del diagnóstico",
        ],
        [OportunidadEtapa.Propuesta] =
        [
            "Enviar propuesta técnica y económica", "Resolver dudas de la propuesta",
            "Presentar el ahorro estimado a Finanzas",
        ],
        [OportunidadEtapa.Negociacion] =
        [
            "Revisar condiciones del contrato", "Ajustar alcance y cronograma", "Coordinar la firma del contrato",
        ],
    };

    // Calls, meetings, emails and notes, by the stage they belong to.
    private static readonly Dictionary<string, (string Tipo, string Descripcion)[]> Actividades = new()
    {
        [OportunidadEtapa.Nuevo] =
        [
            (ActividadTipo.Llamada, "Primera llamada: quieren reducir el trabajo manual del área."),
            (ActividadTipo.Correo, "Enviamos la presentación de DDS y ejemplos de automatización."),
            (ActividadTipo.Llamada, "No contestaron; se reintenta en la semana."),
        ],
        [OportunidadEtapa.Contactado] =
        [
            (ActividadTipo.Reunion, "Reunión de descubrimiento: hoy el proceso se hace a mano con Excel y correo."),
            (ActividadTipo.Llamada, "Conversamos con el área usuaria sobre el volumen mensual del proceso."),
            (ActividadTipo.Nota, "TI pide que la solución se integre con su ERP."),
        ],
        [OportunidadEtapa.Diagnostico] =
        [
            (ActividadTipo.Reunion, "Revisamos el proceso con Operaciones e identificamos los pasos automatizables."),
            (ActividadTipo.Correo, "Compartieron documentos de muestra para el diagnóstico."),
            (ActividadTipo.Nota, "Tienen presupuesto de transformación digital aprobado para este año."),
        ],
        [OportunidadEtapa.Propuesta] =
        [
            (ActividadTipo.Correo, "Enviamos la propuesta técnica y económica."),
            (ActividadTipo.Reunion, "Presentamos la propuesta; la evaluarán con Finanzas."),
            (ActividadTipo.Llamada, "Llamada de seguimiento; piden más detalle de los tiempos de implementación."),
        ],
        [OportunidadEtapa.Negociacion] =
        [
            (ActividadTipo.Reunion, "Demo de la solución en un entorno de pruebas."),
            (ActividadTipo.Nota, "La decisión pasa por el próximo comité de gerencia."),
            (ActividadTipo.Correo, "Enviaron sus observaciones al contrato."),
        ],
    };

    private static readonly string[] MotivosPerdida =
    [
        "Eligió a otro proveedor.", "Sin presupuesto este año.", "Postergaron el proyecto.",
        "Lo desarrollarán con su equipo interno.", "No respondieron después de la propuesta.",
        "El proceso cambiará con su nuevo ERP.",
    ];
}
