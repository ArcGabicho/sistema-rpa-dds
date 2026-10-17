using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Services;

// Demo operation for local development (Seed:DatosDemo): a bot per process
// of each finished demo project, live since its launch week, with a record
// per closed month (ramping up the first two, then around its own level;
// lower when it had a serious incident), its incidents (more during the
// first weeks), a support contract per client from its proposal's monthly
// line, and the licenses its platform needs. A few incidents are open now,
// in every SLA situation, and one bot is paused and one retired.
public static class OperacionSeeder
{
    private const int Semilla = 20261021;

    private sealed record Plantilla(string Titulo, string Descripcion, string Nota, string Solucion, string? Espera = null);

    private static readonly Dictionary<string, Plantilla[]> Plantillas = new()
    {
        [IncidenciaCausa.Credenciales] =
        [
            new("No puede iniciar sesión", "El bot se detiene en el inicio de sesión: el sistema responde «usuario o contraseña incorrectos». La contraseña del usuario de servicio venció.",
                "El log confirma el rechazo en el inicio de sesión desde la primera ejecución del día.",
                "El cliente renovó la contraseña del usuario de servicio; se actualizó en la Bóveda y se reprocesaron los casos pendientes.",
                "Se pidió al cliente restablecer la contraseña del usuario de servicio."),
            new("Certificado digital vencido", "La firma de los documentos falla: el certificado digital del cliente venció.",
                "Se confirmó la fecha de vencimiento del certificado con el área de TI del cliente.",
                "El cliente renovó el certificado; se cargó el nuevo en el servidor del bot y en la Bóveda.",
                "Se pidió al cliente el certificado renovado."),
            new("Usuario de servicio bloqueado", "Tras varios intentos de inicio de sesión fallidos, el usuario de servicio quedó bloqueado.",
                "El bloqueo vino de una contraseña cambiada sin avisar; el bot reintentó tres veces.",
                "La mesa de ayuda del cliente desbloqueó el usuario; el bot ahora se detiene al primer rechazo de acceso.",
                "Se pidió a la mesa de ayuda del cliente desbloquear el usuario."),
        ],
        [IncidenciaCausa.CambioSistema] =
        [
            new("Falla tras una actualización del sistema del cliente", "Desde la actualización del fin de semana, el bot no encuentra un botón de la pantalla de registro.",
                "La pantalla cambió de estructura; se están actualizando los selectores en el ambiente de pruebas.",
                "Se actualizaron los selectores de la pantalla y se probó con casos reales antes de reactivarlo."),
            new("El archivo de origen cambió de formato", "El archivo que descarga el bot trae columnas nuevas y el bot lo rechaza.",
                "Se comparó el archivo nuevo con el anterior: hay dos columnas nuevas y una con otro nombre.",
                "Se adaptó la lectura del archivo al nuevo formato y se agregó una validación que avisa si vuelve a cambiar.",
                "Se pidió al usuario confirmar si el nuevo formato es definitivo."),
            new("Nueva validación en el formulario", "El sistema ahora pide un campo obligatorio que el bot no llenaba.",
                "El campo nuevo es la fecha de vencimiento del documento; falta confirmar de dónde sale.",
                "Se agregó el campo con la regla acordada con el usuario y se reprocesaron los casos del día.",
                "Se consultó al usuario qué valor debe llevar el campo nuevo."),
        ],
        [IncidenciaCausa.Datos] =
        [
            new("Casos con datos incompletos", "Varios casos llegaron sin número de documento y el bot los dejó en la bandeja de excepciones.",
                "Son casos que el área registra a mano a fin de mes; no traen el documento.",
                "Se acordó con el área que esos casos van a revisión manual; el bot ahora les avisa por correo con el detalle."),
            new("Archivo de entrada vacío", "La ejecución de la mañana recibió un archivo sin registros.",
                "El sistema de origen generó el archivo antes de terminar su cierre diario.",
                "Se movió la ejecución una hora después del cierre del sistema de origen y se reprocesó el día."),
            new("Montos con formato distinto", "Algunos montos llegaron con coma decimal y el bot los leyó mal.",
                "Se identificaron los registros afectados del día; ninguno llegó a contabilizarse.",
                "Se normalizó la lectura de montos y se corrigieron los registros afectados con el usuario."),
        ],
        [IncidenciaCausa.Infraestructura] =
        [
            new("El servidor de ejecución no responde", "El monitoreo no recibe señal del servidor del bot desde la madrugada.",
                "La máquina virtual quedó apagada tras una actualización del sistema operativo.",
                "Se reinició la máquina y se programaron las actualizaciones fuera del horario del bot."),
            new("Sin espacio en disco", "El bot falló al guardar los archivos descargados.",
                "El disco del servidor está al 100 %: se acumularon los archivos de meses anteriores.",
                "Se liberó espacio y se agregó la limpieza automática de archivos con más de 30 días."),
            new("Sin conexión con la red del cliente", "El bot no llega al sistema interno del cliente por la VPN.",
                "El túnel VPN cayó a las 6:10; el resto de servicios de DDS funciona.",
                "El área de TI del cliente restableció el túnel; se agregó una alerta de conectividad.",
                "Se pidió al área de TI del cliente revisar el túnel VPN."),
        ],
        [IncidenciaCausa.ErrorBot] =
        [
            new("Se detiene con casos repetidos", "Cuando un caso ya fue procesado, el bot se detiene en vez de saltarlo.",
                "Se reprodujo el error en pruebas con un caso duplicado.",
                "Se corrigió el control de duplicados y se reprocesaron los casos pendientes."),
            new("Tiempo de espera insuficiente", "En las horas de más carga el sistema tarda en responder y el bot falla por tiempo de espera.",
                "Las fallas se concentran entre las 9:00 y las 11:00, cuando el sistema está más lento.",
                "Se ajustaron los tiempos de espera y los reintentos del paso afectado."),
            new("El correo de resultados salió sin adjunto", "El resumen de la ejecución llegó al usuario sin el archivo adjunto.",
                "El archivo se generó bien; la ruta del adjunto apuntaba a la carpeta del día anterior.",
                "Se corrigió la ruta del adjunto y se reenvió el resumen del día."),
        ],
        [IncidenciaCausa.Solicitud] =
        [
            new("Agregar un destinatario al resumen", "El área pide que el resumen diario llegue también a la jefatura.",
                "Se confirmó con el usuario el correo de la jefatura.",
                "Se agregó el destinatario y se confirmó la recepción con el usuario."),
            new("Adelantar la hora de ejecución", "El usuario necesita los resultados antes de las 8:00.",
                "Se revisó a qué hora el sistema de origen tiene los datos listos.",
                "Se adelantó la ejecución y se validó que los datos ya estén disponibles a esa hora."),
            new("Consulta por casos derivados", "El usuario pregunta por qué algunos casos llegaron a su bandeja.",
                "Los casos derivados cumplen las reglas de excepción del PDD.",
                "Se explicaron las reglas de excepción del PDD y se compartió el detalle de los casos."),
        ],
    };

    // Open right now, one in each SLA situation: (severity, state, hours
    // since reported, hours paused, cause of the template).
    private static readonly (string Severidad, string Estado, double Horas, double Pausa, string Causa)[] Abiertas =
    [
        (Severidad.Critica, IncidenciaEstado.EnAtencion, 6.5, 0, IncidenciaCausa.Infraestructura),
        (Severidad.Alta, IncidenciaEstado.Abierta, 1.5, 0, IncidenciaCausa.Credenciales),
        (Severidad.Alta, IncidenciaEstado.EnAtencion, 30, 0, IncidenciaCausa.CambioSistema),
        (Severidad.Media, IncidenciaEstado.EnAtencion, 20, 0, IncidenciaCausa.Datos),
        (Severidad.Baja, IncidenciaEstado.Abierta, 9, 0, IncidenciaCausa.Solicitud),
    ];

    public static async Task SeedAsync(AppDbContext db, IConfiguration config, ILogger logger, CancellationToken ct = default)
    {
        if (!config.GetValue<bool>("Seed:DatosDemo")) return;
        if (await db.Bots.AnyAsync(ct)) return;

        var autorId = await db.AdminUsers.OrderBy(u => u.Id).Select(u => (int?)u.Id).FirstOrDefaultAsync(ct);
        var proyectos = await db.Proyectos
            .Include(p => p.Procesos)
            .Include(p => p.Hitos)
            .Include(p => p.Propuesta).ThenInclude(p => p!.Items)
            .Include(p => p.Oportunidad).ThenInclude(o => o!.Contacto)
            .Where(p => p.Estado == ProyectoEstado.Completado)
            .OrderBy(p => p.FechaFinReal).ThenBy(p => p.Id)
            .AsSplitQuery()
            .ToListAsync(ct);
        if (proyectos.Count == 0) return;
        var ids = proyectos.SelectMany(p => p.Procesos).Where(p => p.ProcesoOrigenId != null).Select(p => p.ProcesoOrigenId!.Value).ToList();
        var origenes = await db.ProcesosEvaluados.AsNoTracking().Include(p => p.Diagnostico).Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);

        var rnd = new Random(Semilla);
        var hoy = Lima.Hoy;
        var ahora = DateTime.UtcNow;
        var bots = new List<(Bot Bot, Proyecto Proyecto, decimal Casos, int Corridas, bool PorEvento)>();
        var notas = new List<Actividad>();

        // --- Bots -----------------------------------------------------------------
        foreach (var proyecto in proyectos)
        {
            var lanzamiento = proyecto.Hitos.OrderBy(h => h.Orden).Last();
            var plataformas = new Dictionary<string, string>();
            foreach (var proceso in proyecto.Procesos.OrderBy(p => p.Orden))
            {
                var origen = proceso.ProcesoOrigenId is { } oid ? origenes.GetValueOrDefault(oid) : null;
                if (origen is null) continue;
                if (!plataformas.TryGetValue(proceso.Servicio, out var plataforma))
                    plataformas[proceso.Servicio] = plataforma = Plataforma(proceso.Servicio, rnd);

                var desde = Min(lanzamiento.FechaInicio.AddDays(rnd.Next(0, 4)), proyecto.FechaFinReal ?? hoy);
                var (horario, corridas, porEvento) = Horario(origen, proceso.Nombre);
                var bot = new Bot
                {
                    Nombre = proceso.Nombre,
                    Descripcion = proceso.PddObjetivo,
                    Servicio = proceso.Servicio,
                    Estado = BotEstado.Activo,
                    EmpresaId = proyecto.EmpresaId,
                    ProyectoId = proyecto.Id,
                    ProcesoProyecto = proceso,
                    Plataforma = plataforma,
                    Horario = horario,
                    EnProduccionDesde = desde,
                    ResponsableId = autorId,
                    HorasMesEstimadas = Roi.Calcular(origen, origen.Diagnostico!.CostoHora).HorasLiberadasMes,
                    CostoHora = origen.CostoHora ?? origen.Diagnostico.CostoHora,
                    MinutosPorCaso = origen.MinutosPorEjecucion,
                    CreatedAtUtc = Lima.AUtc(desde.AddHours(rnd.Next(9, 18))),
                };
                bot.UpdatedAtUtc = bot.CreatedAtUtc;
                bots.Add((bot, proyecto, origen.EjecucionesMes * origen.PorcentajeAutomatizable / 100m, corridas, porEvento));
                notas.Add(new Actividad
                {
                    EmpresaId = proyecto.EmpresaId,
                    OportunidadId = proyecto.OportunidadId,
                    Tipo = ActividadTipo.Nota,
                    Descripcion = $"Bot «{bot.Nombre}» en producción desde el {desde:dd/MM/yyyy}.",
                    AutorId = autorId,
                    CreatedAtUtc = bot.CreatedAtUtc,
                });
            }
        }
        if (bots.Count == 0) return;

        // One retired (the client dropped the process) and one paused (its
        // system is being migrated), both from the earliest launches.
        var antiguos = bots.Where(b => b.Bot.EnProduccionDesde <= hoy.AddDays(-75)).ToList();
        var retirado = antiguos.FirstOrDefault(b => b.Bot.Servicio == ServicioTipo.Ia).Bot ?? antiguos.FirstOrDefault().Bot;
        if (retirado is not null)
        {
            retirado.Estado = BotEstado.Retirado;
            retirado.RetiradoEl = hoy.AddDays(-25);
            notas.Add(new Actividad
            {
                EmpresaId = retirado.EmpresaId,
                Tipo = ActividadTipo.Nota,
                Descripcion = $"Bot «{retirado.Nombre}» retirado: el cliente pasó estas consultas a su nuevo portal de autoservicio.",
                AutorId = autorId,
                CreatedAtUtc = Lima.AUtc(retirado.RetiradoEl.Value.AddHours(11)),
            });
        }
        var pausado = bots.Select(b => b.Bot).LastOrDefault(b => b != retirado && b.Servicio == ServicioTipo.Rpa && b.EnProduccionDesde <= hoy.AddDays(-20));

        // --- Incidents -------------------------------------------------------------
        var incidencias = new List<Incidencia>();
        var graves = new HashSet<(Bot, DateTime)>();
        foreach (var (bot, proyecto, _, _, _) in bots)
        {
            var hasta = bot.RetiradoEl ?? hoy;
            for (var dia = bot.EnProduccionDesde; dia < hasta; dia = dia.AddDays(1))
            {
                // More during the first six weeks (hypercare), then about one every three months.
                var porMes = (dia - bot.EnProduccionDesde).TotalDays < 42 ? 1.3 : 0.35;
                if (rnd.NextDouble() >= porMes / 30) continue;
                var i = Historica(bot, proyecto, Lima.AUtc(dia.AddHours(rnd.Next(6, 21)).AddMinutes(rnd.Next(60))), rnd, autorId);
                if (i is null || i.ResueltaAtUtc > ahora.AddMinutes(-30)) continue;
                incidencias.Add(i);
                if (i.Severidad is Severidad.Critica or Severidad.Alta) graves.Add((bot, new DateTime(Lima.DesdeUtc(i.CreatedAtUtc).Year, Lima.DesdeUtc(i.CreatedAtUtc).Month, 1)));
            }
        }

        var activos = bots.Select(b => b.Bot).Where(b => b.Estado == BotEstado.Activo && b != pausado && b.EnProduccionDesde <= hoy.AddDays(-7)).ToList();
        foreach (var (severidad, estado, horas, pausa, causa) in Abiertas)
        {
            if (activos.Count == 0) break;
            var bot = activos[rnd.Next(activos.Count)];
            activos.Remove(bot);
            var proyecto = bots.First(b => b.Bot == bot).Proyecto;
            incidencias.Add(Abierta(bot, proyecto, severidad, estado, ahora.AddHours(-horas), pausa, causa, rnd, autorId));
        }
        if (pausado is not null)
        {
            pausado.Estado = BotEstado.EnPausa;
            pausado.UpdatedAtUtc = ahora.AddDays(-4);
            var proyecto = bots.First(b => b.Bot == pausado).Proyecto;
            var i = Abierta(pausado, proyecto, Severidad.Media, IncidenciaEstado.EsperandoCliente, ahora.AddDays(-4).AddHours(-3), 70, IncidenciaCausa.CambioSistema, rnd, autorId);
            i.Titulo = "Pausado por la migración del sistema del cliente";
            i.Descripcion = "El cliente está migrando el sistema donde trabaja el bot. Se pausó hasta que el nuevo esté en producción, para adaptarlo a sus pantallas.";
            incidencias.Add(i);
        }

        var correlativos = new Dictionary<int, int>();
        foreach (var i in incidencias.OrderBy(i => i.CreatedAtUtc))
        {
            var anio = Lima.DesdeUtc(i.CreatedAtUtc).Year;
            correlativos[anio] = correlativos.GetValueOrDefault(anio) + 1;
            i.Codigo = $"INC-{anio}-{correlativos[anio]:0000}";
        }

        // --- Monthly records ---------------------------------------------------------
        var ultimoMes = Ahorro.UltimoMesCerrado(hoy);
        var sinRegistro = bots.Where(b => b.Bot.Estado == BotEstado.Activo && b.Bot.EnProduccionDesde < ultimoMes).Select(b => b.Bot).TakeLast(2).ToHashSet();
        foreach (var (bot, _, casosMes, corridasMes, porEvento) in bots)
        {
            var nivel = 0.8 + rnd.NextDouble() * 0.32;
            var n = 0;
            foreach (var mes in Ahorro.MesesEnProduccion(bot, hoy))
            {
                if (mes == ultimoMes && sinRegistro.Contains(bot)) continue;
                var dias = DateTime.DaysInMonth(mes.Year, mes.Month);
                var desde = bot.EnProduccionDesde > mes ? bot.EnProduccionDesde : mes;
                var hasta = bot.RetiradoEl is { } r && r < mes.AddMonths(1) ? r : mes.AddMonths(1);
                var fraccion = (hasta - desde).TotalDays / dias;
                var rampa = n == 0 ? 0.6 + rnd.NextDouble() * 0.15 : n == 1 ? 0.85 + rnd.NextDouble() * 0.1 : 1;
                var grave = graves.Contains((bot, mes));
                var factor = nivel * rampa * (0.94 + rnd.NextDouble() * 0.12) * (grave ? 0.82 + rnd.NextDouble() * 0.1 : 1);
                n++;

                var casos = (int)Math.Round((double)casosMes * factor * fraccion);
                var derivados = (int)Math.Round(casos * (0.02 + rnd.NextDouble() * 0.06));
                var ejecuciones = porEvento ? casos + derivados : Math.Max(1, (int)Math.Round(corridasMes * fraccion * (0.95 + rnd.NextDouble() * 0.05)));
                // About 1.5 % of runs fail, a few more in a month with a serious incident.
                var tasaFalla = grave ? 0.06 : 0.015;
                var fallidas = 0;
                for (var k = 0; k < ejecuciones; k++) if (rnd.NextDouble() < tasaFalla) fallidas++;
                bot.Mediciones.Add(new MedicionBot
                {
                    Mes = mes,
                    Ejecuciones = ejecuciones,
                    EjecucionesFallidas = fallidas,
                    CasosProcesados = casos,
                    CasosDerivados = derivados,
                    Notas = grave ? "Mes con una caída que detuvo el bot por unas horas." : null,
                    UpdatedAtUtc = Lima.AUtc(mes.AddMonths(1).AddDays(rnd.Next(1, 4)).AddHours(10)),
                });
            }
        }

        // --- Support contracts ----------------------------------------------------------
        // Different first terms, so some are close to renewal now: the third
        // client let its contract expire, the rest renewed for a year.
        int[] plazos = [3, 6, 3, 12, 6, 12, 3, 12, 12, 6, 12, 12, 12];
        var contratos = new List<ContratoSoporte>();
        var porEmpresa = bots.GroupBy(b => b.Bot.EmpresaId).OrderBy(g => g.Min(b => b.Bot.EnProduccionDesde)).ToList();
        for (var k = 0; k < porEmpresa.Count; k++)
        {
            var grupo = porEmpresa[k];
            var propuesta = grupo.First().Proyecto.Propuesta;
            var monto = propuesta?.Items.Where(i => i.Tipo == PropuestaItemTipo.Mensual).Sum(i => i.Cantidad * i.PrecioUnitario) ?? 0;
            if (monto <= 0) continue;

            var inicio = grupo.Min(b => b.Bot.EnProduccionDesde);
            var contrato = new ContratoSoporte
            {
                EmpresaId = grupo.Key,
                PropuestaId = propuesta?.Id,
                Nombre = "Soporte, monitoreo y operación",
                Estado = ContratoEstado.Vigente,
                MontoMensual = Math.Round(monto, 2),
                Moneda = propuesta?.Moneda ?? Moneda.Soles,
                FechaInicio = inicio,
                FechaFin = inicio.AddMonths(plazos[k % plazos.Length]).AddDays(-1),
                Notas = "Incluye monitoreo de las ejecuciones, atención de incidencias según SLA y ajustes menores por cambios en los sistemas.",
                CreatedAtUtc = Lima.AUtc(inicio.AddHours(12)),
            };
            if (contrato.FechaFin < hoy && k != 2)
            {
                var renovado = contrato.FechaFin;
                contrato.FechaFin = contrato.FechaFin.AddMonths(12);
                notas.Add(new Actividad
                {
                    EmpresaId = contrato.EmpresaId,
                    Tipo = ActividadTipo.Nota,
                    Descripcion = $"Contrato «{contrato.Nombre}» renovado hasta el {contrato.FechaFin:dd/MM/yyyy} ({OperacionMapping.Monto(contrato.Moneda, contrato.MontoMensual)} al mes).",
                    AutorId = autorId,
                    CreatedAtUtc = Lima.AUtc(renovado.AddDays(-rnd.Next(3, 12)).AddHours(16)),
                });
            }
            contrato.UpdatedAtUtc = contrato.CreatedAtUtc;
            contratos.Add(contrato);
        }

        // --- Licenses -------------------------------------------------------------
        // On each client's own renewal cycle; DDS's development seats too.
        var licencias = new List<Licencia>();
        foreach (var grupo in porEmpresa)
        {
            var empresaBots = grupo.Select(b => b.Bot).Where(b => b.Estado != BotEstado.Retirado).ToList();
            Licencia Nueva(string nombre, string proveedor, int cantidad, decimal? costoAnual, bool pagaCliente, Bot? bot = null) => new()
            {
                EmpresaId = grupo.Key, Bot = bot, Nombre = nombre, Proveedor = proveedor, Cantidad = cantidad,
                CostoAnual = costoAnual, Moneda = Moneda.Dolares, PagaCliente = pagaCliente,
                VenceEl = hoy.AddDays(rnd.Next(-12, 330)),
                CreatedAtUtc = Lima.AUtc(grupo.Min(b => b.Bot.EnProduccionDesde).AddDays(-7).AddHours(11)),
            };

            var uipath = empresaBots.Where(b => b.Plataforma == "UiPath").ToList();
            if (uipath.Count > 0)
            {
                licencias.Add(Nueva("UiPath Unattended Robot", "UiPath", (uipath.Count + 1) / 2, null, true));
                licencias.Add(Nueva("UiPath Automation Cloud (Orchestrator)", "UiPath", 1, null, true));
            }
            var powerAutomate = empresaBots.Where(b => b.Plataforma == "Power Automate").ToList();
            if (powerAutomate.Count > 0)
                licencias.Add(Nueva("Power Automate Process", "Microsoft", powerAutomate.Count, 1800m * powerAutomate.Count, rnd.NextDouble() < 0.7, powerAutomate.Count == 1 ? powerAutomate[0] : null));
            if (empresaBots.Any(b => b.Plataforma?.Contains("Power BI") == true))
            {
                var usuarios = rnd.Next(4, 13);
                licencias.Add(Nueva("Power BI Pro", "Microsoft", usuarios, 168m * usuarios, true));
            }
        }
        licencias.Add(new Licencia
        {
            Nombre = "UiPath Studio (equipo de desarrollo)", Proveedor = "UiPath", Cantidad = 3, Moneda = Moneda.Dolares,
            PagaCliente = false, VenceEl = hoy.AddDays(41), Notas = "Licencias de desarrollo de DDS.",
        });
        licencias.Add(new Licencia
        {
            Nombre = "Power BI Pro (equipo DDS)", Proveedor = "Microsoft", Cantidad = 5, CostoAnual = 840, Moneda = Moneda.Dolares,
            PagaCliente = false, VenceEl = hoy.AddDays(17),
        });

        db.Bots.AddRange(bots.Select(b => b.Bot));
        db.Incidencias.AddRange(incidencias);
        db.ContratosSoporte.AddRange(contratos);
        db.Licencias.AddRange(licencias);
        db.Actividades.AddRange(notas);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Datos demo: {Bots} bots, {Incidencias} incidencias, {Contratos} contratos, {Licencias} licencias.",
            bots.Count, incidencias.Count, contratos.Count, licencias.Count);
    }

    // A past incident, already resolved: taken within (almost always) its
    // response target, sometimes waiting on the client, and resolved within
    // (most of the time) its resolution target.
    private static Incidencia? Historica(Bot bot, Proyecto proyecto, DateTime reportada, Random rnd, int? autorId)
    {
        var causa = Elegir(rnd, (IncidenciaCausa.Credenciales, 24), (IncidenciaCausa.CambioSistema, 22), (IncidenciaCausa.Datos, 20),
            (IncidenciaCausa.ErrorBot, 16), (IncidenciaCausa.Infraestructura, 10), (IncidenciaCausa.Solicitud, 8));
        var severidad = causa == IncidenciaCausa.Solicitud
            ? Elegir(rnd, (Severidad.Media, 40), (Severidad.Baja, 60))
            : Elegir(rnd, (Severidad.Critica, 8), (Severidad.Alta, 27), (Severidad.Media, 45), (Severidad.Baja, 20));
        var plantilla = Plantillas[causa][rnd.Next(Plantillas[causa].Length)];
        var i = Nueva(bot, proyecto, severidad, reportada, plantilla, causa, rnd, autorId);

        var (respuesta, resolucion) = Sla.Objetivo(severidad);
        var respondida = reportada.AddMinutes(respuesta * 60 * (rnd.NextDouble() < 0.04 ? 1.1 + rnd.NextDouble() * 0.8 : 0.08 + rnd.NextDouble() * 0.6));
        var trabajo = TimeSpan.FromHours(resolucion * (rnd.NextDouble() < 0.08 ? 1.05 + rnd.NextDouble() * 0.7 : 0.12 + rnd.NextDouble() * 0.65));
        var fin = respondida > reportada + trabajo ? respondida.AddMinutes(30) : reportada + trabajo;

        i.PrimeraRespuestaAtUtc = respondida;
        i.Seguimiento.Add(Cambio("Estado: Abierta → En atención.", respondida, autorId));
        var nota = respondida + (fin - respondida) * 0.3;
        i.Seguimiento.Add(new SeguimientoIncidencia { Tipo = SeguimientoTipo.Nota, Texto = plantilla.Nota, AutorId = autorId, CreatedAtUtc = nota });

        if (plantilla.Espera is not null && rnd.NextDouble() < 0.5)
        {
            var pausa = TimeSpan.FromHours(2 + rnd.NextDouble() * 22);
            var desde = nota.AddMinutes(10);
            i.Seguimiento.Add(new SeguimientoIncidencia { Tipo = SeguimientoTipo.Nota, Texto = plantilla.Espera, AutorId = autorId, CreatedAtUtc = desde });
            i.Seguimiento.Add(Cambio("Estado: En atención → Esperando al cliente.", desde.AddMinutes(1), autorId));
            i.Seguimiento.Add(Cambio("Estado: Esperando al cliente → En atención.", desde + pausa, autorId));
            i.MinutosEnPausa = (int)Math.Round(pausa.TotalMinutes);
            fin += pausa;
        }

        i.Estado = IncidenciaEstado.Resuelta;
        i.Causa = causa;
        i.Solucion = plantilla.Solucion;
        i.ResueltaAtUtc = fin;
        i.UpdatedAtUtc = fin;
        i.Seguimiento.Add(Cambio($"Estado: En atención → Resuelta. Causa: {IncidenciaCausa.Label(causa)}.", fin, autorId));
        return i;
    }

    // An incident still open, reported `reportada`; `pausaHoras` of waiting
    // on the client so far when it's in that state.
    private static Incidencia Abierta(Bot bot, Proyecto proyecto, string severidad, string estado, DateTime reportada, double pausaHoras, string causa, Random rnd, int? autorId)
    {
        var plantilla = Plantillas[causa][rnd.Next(Plantillas[causa].Length)];
        var i = Nueva(bot, proyecto, severidad, reportada, plantilla, causa, rnd, autorId);
        i.Estado = estado;
        if (estado == IncidenciaEstado.Abierta) return i;

        var (respuesta, _) = Sla.Objetivo(severidad);
        var respondida = reportada.AddMinutes(respuesta * 60 * (0.15 + rnd.NextDouble() * 0.4));
        i.PrimeraRespuestaAtUtc = respondida;
        i.Seguimiento.Add(Cambio("Estado: Abierta → En atención.", respondida, autorId));
        i.Seguimiento.Add(new SeguimientoIncidencia { Tipo = SeguimientoTipo.Nota, Texto = plantilla.Nota, AutorId = autorId, CreatedAtUtc = respondida.AddMinutes(25) });
        if (estado == IncidenciaEstado.EsperandoCliente)
        {
            var desde = DateTime.UtcNow.AddHours(-pausaHoras);
            i.Seguimiento.Add(new SeguimientoIncidencia { Tipo = SeguimientoTipo.Nota, Texto = plantilla.Espera ?? "Se pidió al cliente confirmar cuándo termina la migración.", AutorId = autorId, CreatedAtUtc = desde.AddMinutes(-5) });
            i.Seguimiento.Add(Cambio("Estado: En atención → Esperando al cliente.", desde, autorId));
            i.PausadaDesdeUtc = desde;
        }
        i.UpdatedAtUtc = i.Seguimiento.Max(s => s.CreatedAtUtc);
        return i;
    }

    private static Incidencia Nueva(Bot bot, Proyecto proyecto, string severidad, DateTime reportada, Plantilla plantilla, string causa, Random rnd, int? autorId)
    {
        var canal = causa == IncidenciaCausa.Solicitud
            ? Elegir(rnd, (IncidenciaCanal.Correo, 50), (IncidenciaCanal.Whatsapp, 40), (IncidenciaCanal.Llamada, 10))
            : Elegir(rnd, (IncidenciaCanal.Monitoreo, 45), (IncidenciaCanal.Correo, 22), (IncidenciaCanal.Whatsapp, 18), (IncidenciaCanal.Llamada, 5), (IncidenciaCanal.Interno, 10));
        var contacto = proyecto.Oportunidad?.Contacto;
        var i = new Incidencia
        {
            Codigo = "",
            Titulo = plantilla.Titulo,
            Descripcion = plantilla.Descripcion,
            EmpresaId = bot.EmpresaId,
            Bot = bot,
            Severidad = severidad,
            Estado = IncidenciaEstado.Abierta,
            Canal = canal,
            ReportadoPor = canal is IncidenciaCanal.Monitoreo or IncidenciaCanal.Interno || contacto is null ? null : $"{contacto.Nombres} {contacto.Apellidos}".Trim(),
            ResponsableId = autorId,
            CreatedAtUtc = reportada,
            UpdatedAtUtc = reportada,
        };
        i.Seguimiento.Add(Cambio($"Incidencia registrada · severidad {Severidad.Label(severidad).ToLowerInvariant()}.", reportada, autorId));
        return i;
    }

    private static SeguimientoIncidencia Cambio(string texto, DateTime cuando, int? autorId) =>
        new() { Tipo = SeguimientoTipo.Cambio, Texto = texto, AutorId = autorId, CreatedAtUtc = cuando };

    private static string Plataforma(string servicio, Random rnd) => servicio switch
    {
        ServicioTipo.Ia => Elegir(rnd, ("n8n + Claude", 45), ("Python + Azure OpenAI", 35), ("Power Automate + AI Builder", 20)),
        ServicioTipo.Analitica => Elegir(rnd, ("Power BI", 60), ("Python + Power BI", 40)),
        _ => Elegir(rnd, ("UiPath", 45), ("Power Automate", 30), ("Python", 25)),
    };

    // When it runs, how many runs that makes a month, and whether it runs
    // once per case (AI assistants answer each message as it comes).
    private static (string Horario, int Corridas, bool PorEvento) Horario(ProcesoEvaluado p, string nombre)
    {
        if (p.Servicio == ServicioTipo.Ia)
            return (nombre.Contains("correo", StringComparison.OrdinalIgnoreCase) ? "Al llegar cada correo" : "Al llegar cada consulta", 0, true);
        return p.EjecucionesMes switch
        {
            <= 8 => ("Lunes, 6:00", 4, false),
            <= 35 => ("Lunes a viernes, 7:00", 22, false),
            <= 70 => ("Lunes a viernes, 7:00 y 15:00", 44, false),
            <= 1200 => ("Cada hora, de 8:00 a 19:00, lunes a viernes", 264, false),
            _ => ("Cada 15 minutos, todos los días", 2880, false),
        };
    }

    private static T Elegir<T>(Random rnd, params (T Valor, int Peso)[] opciones)
    {
        var x = rnd.Next(opciones.Sum(o => o.Peso));
        foreach (var (valor, peso) in opciones)
        {
            if (x < peso) return valor;
            x -= peso;
        }
        return opciones[^1].Valor;
    }

    private static DateTime Min(DateTime a, DateTime b) => a < b ? a : b;
}
