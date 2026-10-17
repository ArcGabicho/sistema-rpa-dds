namespace Server.Services;

// Demo PDD content for the typical processes of the demo diagnoses (see
// DiagnosticoSeeder), used by ProyectoSeeder. Generic on purpose: the demo
// companies are fictitious, so systems are named by kind ("el ERP").
public static class PddPlantillas
{
    public sealed record Plantilla(
        string Objetivo,
        string Alcance,
        string[] Sistemas,
        string[] Entradas,
        string[] Salidas,
        string[] Actuales,
        string[] Reglas,
        string[] Excepciones,
        string[] Propuestos,
        string[] Preguntas,
        string Notas);

    public static Plantilla? Para(string proceso) => Todas.GetValueOrDefault(proceso);

    private static readonly Dictionary<string, Plantilla> Todas = new()
    {
        ["Conciliación bancaria diaria"] = new(
            "Conciliar cada día los movimientos bancarios con los registros del ERP, para que Tesorería tenga los saldos al día sin cruzar archivos a mano.",
            "Cubre las cuentas corrientes en soles y dólares. No cubre la conciliación de tarjetas ni los ajustes contables, que siguen en manos del analista.",
            ["Banca por internet", "ERP", "Excel"],
            ["Extracto de movimientos del día anterior de cada cuenta", "Registro de cobros y pagos del ERP"],
            ["Reporte de conciliación por cuenta", "Lista de partidas sin conciliar para revisión"],
            ["El analista ingresa a la banca por internet y descarga el extracto de cada cuenta.", "Exporta del ERP los cobros y pagos del día.", "Cruza ambos archivos en Excel por monto, fecha y referencia.", "Marca las partidas conciliadas y anota las diferencias.", "Envía el reporte a la jefa de Tesorería."],
            ["Una partida concilia si coinciden monto y referencia, con hasta 2 días de diferencia en la fecha.", "Las comisiones bancarias se registran en la cuenta de gastos bancarios."],
            ["La banca por internet no está disponible → el bot reintenta a la hora y avisa si sigue sin acceso.", "Un movimiento coincide con dos registros → queda para revisión del analista."],
            ["El bot descarga a las 7:00 el extracto de cada cuenta.", "Exporta los movimientos del ERP del día anterior.", "Cruza los registros con las reglas acordadas.", "Genera el reporte y la lista de pendientes.", "Envía el reporte por correo y el analista revisa solo los pendientes."],
            ["¿Qué cuentas entran en el primer alcance?", "¿Quién recibe el reporte cuando la jefa de Tesorería no está?"],
            "Lo hace una analista de Tesorería cada mañana. Descarga extractos de 6 cuentas del banco y cruza con el reporte de cobros y pagos del ERP en Excel, por monto y referencia. Las diferencias las revisa a mano; suelen ser comisiones o pagos agrupados."),

        ["Registro de facturas de proveedores"] = new(
            "Registrar en el ERP las facturas de proveedores que llegan por correo, para que Contabilidad deje de digitarlas y no se pasen las fechas de pago.",
            "Cubre facturas electrónicas en PDF y XML con orden de compra. No cubre facturas sin orden de compra ni notas de crédito.",
            ["Correo", "ERP", "Portal de SUNAT"],
            ["Correos de proveedores con la factura adjunta (PDF y XML)", "Órdenes de compra del ERP"],
            ["Factura registrada en el ERP con su orden de compra", "Lista de facturas observadas"],
            ["El asistente revisa el buzón de facturas.", "Descarga el PDF y el XML de cada factura.", "Valida la factura en el portal de SUNAT.", "Busca la orden de compra en el ERP y compara montos.", "Digita la factura en el ERP y archiva los archivos."],
            ["La factura debe estar aceptada en SUNAT antes de registrarse.", "El monto de la factura no puede superar el de la orden de compra."],
            ["La factura no tiene orden de compra → se deriva a Compras.", "El XML no coincide con el PDF → se registra con el XML y se observa."],
            ["El bot lee el buzón cada hora y descarga los adjuntos.", "Valida cada factura en SUNAT.", "Cruza la factura con su orden de compra.", "Registra en el ERP las que cuadran.", "Envía a Contabilidad la lista de observadas."],
            ["¿Qué tolerancia de diferencia de monto se acepta?", "¿Se reciben facturas de proveedores del exterior?"],
            "Dos asistentes de Contabilidad registran a mano unas 800 facturas al mes. Llegan al buzón facturas@ en PDF y XML. Validan en SUNAT y buscan la OC en el ERP. Las que no tienen OC las mandan a Compras por correo."),

        ["Cobranza y envío de estados de cuenta"] = new(
            "Enviar a cada cliente su estado de cuenta y los recordatorios de pago a tiempo, para reducir la cartera vencida sin cargar al equipo de Cobranzas.",
            "Cubre el envío de estados de cuenta y recordatorios por correo. No cubre la negociación de deudas ni las llamadas.",
            ["ERP", "Correo"],
            ["Reporte de cuentas por cobrar del ERP", "Base de contactos de pago de los clientes"],
            ["Correos de estado de cuenta enviados", "Reporte de envíos y rebotes"],
            ["La gestora exporta las cuentas por cobrar del ERP.", "Filtra por cliente y arma el estado de cuenta en Excel.", "Lo envía por correo al contacto de pagos.", "Anota en una hoja de seguimiento a quién envió."],
            ["Se envía recordatorio 3 días antes del vencimiento y a los 1, 7 y 15 días de vencida.", "Los clientes con disputa abierta no reciben recordatorios."],
            ["El correo del contacto rebota → se marca para que la gestora lo actualice.", "El cliente no tiene contacto de pagos → se avisa a la gestora."],
            ["El bot extrae cada mañana las cuentas por cobrar.", "Arma el estado de cuenta de cada cliente.", "Envía los recordatorios según el calendario acordado.", "Registra los envíos y rebotes para la gestora."],
            ["¿Qué plantilla de correo se usa para cada recordatorio?", "¿Cómo se identifica en el ERP una disputa abierta?"],
            "La gestora de cobranzas arma estados de cuenta en Excel para unos 300 clientes y los envía por correo uno por uno. Lleva una hoja de seguimiento. Los recordatorios no siempre salen a tiempo a fin de mes."),

        ["Cierre contable mensual"] = new(
            "Acortar el cierre contable automatizando las conciliaciones y reportes repetitivos, para que el equipo se concentre en el análisis.",
            "Cubre la preparación de conciliaciones de cuentas y los reportes de cierre. No cubre los asientos de ajuste ni la aprobación del cierre.",
            ["ERP", "Excel"],
            ["Balance de comprobación del ERP", "Auxiliares de cuentas por cobrar y por pagar"],
            ["Conciliaciones de cuentas preparadas", "Paquete de reportes de cierre"],
            ["El contador exporta el balance y los auxiliares del ERP.", "Arma las conciliaciones de cada cuenta en Excel.", "Revisa diferencias y prepara los asientos de ajuste.", "Genera los reportes de cierre para Gerencia."],
            ["El cierre se hace los primeros 5 días hábiles del mes."],
            ["Una cuenta no concilia → queda para revisión del contador con el detalle de la diferencia."],
            ["El bot exporta el balance y los auxiliares el primer día hábil.", "Prepara las conciliaciones con el formato actual.", "Arma el paquete de reportes.", "El contador revisa diferencias y hace los ajustes."],
            ["¿Qué cuentas se concilian cada mes?", "¿El formato de los reportes de cierre es fijo?"],
            "El cierre toma unos 8 días entre tres personas. Gran parte es exportar del ERP y armar conciliaciones en Excel. Los ajustes los decide el contador general."),

        ["Altas y bajas en planilla"] = new(
            "Registrar las altas y bajas de colaboradores en los sistemas de planilla sin digitación manual, para cumplir los plazos de ley y evitar errores.",
            "Cubre altas y bajas en el sistema de planilla y en T-Registro. No cubre el cálculo de liquidaciones.",
            ["Sistema de planilla", "T-Registro (SUNAT)", "Correo"],
            ["Formulario de alta o baja enviado por el área solicitante", "Documentos del colaborador"],
            ["Colaborador registrado o dado de baja en planilla y T-Registro", "Constancia de registro"],
            ["El área envía por correo el formulario de alta o baja.", "El analista de RR.HH. revisa que esté completo.", "Registra al colaborador en el sistema de planilla.", "Registra el alta o baja en T-Registro.", "Guarda la constancia en el legajo."],
            ["El alta en T-Registro se hace a más tardar el día de inicio de labores.", "La baja se registra dentro del plazo legal desde el cese."],
            ["El formulario está incompleto → se devuelve al área con lo que falta.", "T-Registro no responde → el bot reintenta y avisa al analista."],
            ["El bot lee los formularios recibidos.", "Valida que estén completos.", "Registra al colaborador en planilla y en T-Registro.", "Guarda la constancia y avisa al analista."],
            ["¿Qué campos del formulario son obligatorios?", "¿Quién aprueba el alta antes de registrarla?"],
            "Un analista de RR.HH. registra unas 80 altas y bajas al mes. Llegan por correo en un formulario de Excel. Las registra en el sistema de planilla y luego en T-Registro. A veces se pasan los plazos en temporada alta."),

        ["Atención de consultas de colaboradores"] = new(
            "Responder al instante las consultas frecuentes de los colaboradores sobre planilla, vacaciones y beneficios, para descargar al equipo de RR.HH.",
            "Cubre consultas frecuentes con respuesta en las políticas internas. No cubre casos personales que requieren a un analista.",
            ["Correo", "Intranet", "Sistema de planilla"],
            ["Consultas de los colaboradores", "Políticas internas y calendario de pagos"],
            ["Respuesta al colaborador", "Consultas derivadas a un analista"],
            ["El colaborador escribe al correo de RR.HH.", "Un analista lee la consulta y busca la respuesta.", "Responde por correo.", "Si es un caso personal, lo deriva."],
            ["Las respuestas se basan solo en las políticas publicadas.", "Los datos personales solo se comparten con el propio colaborador."],
            ["La consulta no está en las políticas → se deriva a un analista.", "El colaborador pide datos de otra persona → se rechaza y se deriva."],
            ["El asistente de IA recibe la consulta.", "Busca la respuesta en las políticas internas.", "Responde al colaborador.", "Deriva a un analista lo que no puede resolver."],
            ["¿Qué políticas están vigentes y dónde están publicadas?", "¿Qué canal usarán los colaboradores?"],
            "RR.HH. recibe unas 600 consultas al mes, la mayoría repetidas: fecha de pago, saldo de vacaciones, boletas. Dos personas las responden por correo."),

        ["Registro de guías de remisión"] = new(
            "Emitir y registrar las guías de remisión a partir de los pedidos despachados, para que Almacén no las digite y salgan sin errores.",
            "Cubre guías de remisión remitente de despachos nacionales. No cubre traslados entre almacenes propios.",
            ["ERP", "Portal de SUNAT", "Excel"],
            ["Pedidos despachados del ERP", "Datos del transportista"],
            ["Guía de remisión electrónica emitida", "Guía vinculada al pedido en el ERP"],
            ["El asistente de almacén revisa los pedidos despachados.", "Digita los datos de cada guía en el portal.", "Descarga la guía y la imprime.", "Registra el número de guía en el ERP."],
            ["Cada despacho lleva su guía antes de salir del almacén."],
            ["Falta el dato del transportista → se pide a Almacén antes de emitir.", "El portal rechaza la guía → queda para revisión con el motivo."],
            ["El bot toma los pedidos despachados.", "Emite la guía electrónica.", "Registra el número en el ERP.", "Avisa a Almacén cuando la guía está lista."],
            ["¿Qué datos del transportista están en el ERP?", "¿Cuántos despachos salen en el pico del día?"],
            "Almacén emite más de mil guías al mes. Digitan los datos del pedido en el portal y luego anotan el número en el ERP. Los errores de digitación hacen que se anulen guías."),

        ["Seguimiento de pedidos a clientes"] = new(
            "Responder automáticamente a los clientes en qué estado está su pedido, para que Atención al cliente deje de buscar cada caso a mano.",
            "Cubre consultas de estado de pedidos ya registrados. No cubre reclamos ni cambios de pedido.",
            ["ERP", "Correo", "WhatsApp Business"],
            ["Consultas de clientes con número de pedido", "Estado de los pedidos en el ERP"],
            ["Respuesta con el estado del pedido", "Consultas derivadas a un asesor"],
            ["El cliente escribe por correo o WhatsApp.", "El asesor busca el pedido en el ERP.", "Revisa el estado y la fecha estimada.", "Responde al cliente."],
            ["Solo se informa el estado al cliente que hizo el pedido."],
            ["El pedido no existe → se pide el número correcto.", "El pedido está retrasado → se deriva a un asesor."],
            ["El asistente de IA recibe la consulta.", "Identifica el pedido y consulta su estado.", "Responde al cliente.", "Deriva a un asesor los retrasos y casos raros."],
            ["¿Cómo se identifica al cliente en WhatsApp?", "¿Qué estados del ERP se muestran al cliente?"],
            "Atención al cliente recibe más de mil consultas al mes preguntando dónde está su pedido. Buscan en el ERP y responden. En campañas se demoran días."),

        ["Actualización de inventario en el ERP"] = new(
            "Actualizar el inventario del ERP con los conteos y movimientos de almacén a tiempo, para que Ventas y Compras trabajen con stock real.",
            "Cubre la carga de ajustes de inventario y transferencias. No cubre la valorización.",
            ["ERP", "Excel"],
            ["Conteos y movimientos registrados por Almacén en Excel"],
            ["Inventario actualizado en el ERP", "Reporte de diferencias"],
            ["Almacén registra conteos y movimientos en Excel.", "Un asistente los revisa.", "Los digita en el ERP.", "Envía el reporte de diferencias a Logística."],
            ["Los ajustes mayores a un umbral necesitan aprobación del jefe de almacén."],
            ["El código del producto no existe en el ERP → queda para revisión.", "El ajuste supera el umbral → se envía a aprobación."],
            ["El bot lee los archivos de Almacén.", "Valida códigos y cantidades.", "Carga los movimientos en el ERP.", "Envía el reporte de diferencias."],
            ["¿Cuál es el umbral de aprobación?", "¿Con qué frecuencia se cuenta el inventario?"],
            "Almacén anota conteos en Excel y un asistente los digita en el ERP dos veces por semana. El stock del ERP suele estar desfasado unos días."),

        ["Carga de órdenes de compra"] = new(
            "Cargar en el ERP las órdenes de compra que envían los clientes, para atender más rápido y sin errores de digitación.",
            "Cubre órdenes de compra recibidas por correo en PDF o Excel. No cubre pedidos por teléfono.",
            ["Correo", "ERP"],
            ["Órdenes de compra de clientes por correo"],
            ["Pedido de venta creado en el ERP", "Confirmación al cliente"],
            ["Ventas recibe la orden de compra por correo.", "La digita como pedido en el ERP.", "Verifica precios y stock.", "Confirma al cliente."],
            ["El precio del pedido debe coincidir con la lista vigente del cliente."],
            ["Un producto no tiene stock → se avisa al vendedor.", "El precio no coincide → queda para revisión del vendedor."],
            ["El bot lee las órdenes del buzón.", "Extrae los productos y cantidades.", "Crea el pedido en el ERP.", "Envía la confirmación al cliente."],
            ["¿Los clientes usan un formato fijo de orden de compra?", "¿Quién confirma al cliente hoy?"],
            "Ventas digita unas 500 órdenes de compra al mes. Llegan en PDF o Excel con formatos distintos. Los errores de digitación generan devoluciones."),

        ["Reporte semanal de ventas"] = new(
            "Tener cada lunes el reporte de ventas listo y actualizado en un tablero, sin armarlo a mano.",
            "Cubre ventas por producto, canal y vendedor. No cubre proyecciones.",
            ["ERP", "Excel", "Power BI"],
            ["Ventas de la semana del ERP"],
            ["Tablero de ventas actualizado", "Resumen por correo a Gerencia"],
            ["El analista exporta las ventas del ERP.", "Las ordena en Excel con tablas dinámicas.", "Arma los gráficos.", "Envía el reporte a Gerencia."],
            ["La semana va de lunes a domingo."],
            ["La exportación del ERP falla → se avisa al analista."],
            ["El proceso extrae las ventas cada lunes temprano.", "Actualiza el modelo de datos.", "El tablero se refresca solo.", "Envía el resumen a Gerencia."],
            ["¿Qué indicadores necesita Gerencia?", "¿Quiénes tendrán acceso al tablero?"],
            "Cada lunes un analista pasa la mañana armando el reporte de ventas en Excel. Gerencia pide cortes distintos y hay que rehacerlo."),

        ["Clasificación de correos entrantes"] = new(
            "Clasificar y derivar automáticamente los correos que llegan al buzón general, para que cada área reciba lo suyo sin que alguien los lea uno por uno.",
            "Cubre el buzón general de atención. No cubre la respuesta a los correos.",
            ["Correo"],
            ["Correos del buzón general"],
            ["Correo derivado al área correspondiente", "Reporte diario de volumen por tema"],
            ["Una persona lee cada correo del buzón general.", "Decide a qué área corresponde.", "Lo reenvía.", "Hace seguimiento de los urgentes."],
            ["Los reclamos se derivan siempre a Atención al cliente con prioridad."],
            ["El correo no encaja en ningún tema → queda para revisión manual."],
            ["El asistente de IA lee cada correo entrante.", "Lo clasifica por tema y urgencia.", "Lo deriva al área.", "Deja en revisión los dudosos."],
            ["¿Qué temas y áreas existen?", "¿Cómo se define un correo urgente?"],
            "El buzón general recibe miles de correos al mes. Dos personas los leen y reenvían. Los urgentes a veces se pierden entre los demás."),

        ["Respuestas a consultas frecuentes"] = new(
            "Responder al instante las preguntas frecuentes de los clientes, para que los asesores atiendan solo los casos que lo requieren.",
            "Cubre preguntas sobre horarios, precios publicados y requisitos. No cubre reclamos.",
            ["Web", "WhatsApp Business"],
            ["Preguntas de clientes", "Base de respuestas aprobadas"],
            ["Respuesta al cliente", "Casos derivados a un asesor"],
            ["El cliente escribe por la web o WhatsApp.", "Un asesor responde con la información publicada."],
            ["Solo se responde con información aprobada."],
            ["La pregunta no está en la base → se deriva a un asesor."],
            ["El asistente de IA responde con la base aprobada.", "Deriva a un asesor lo que no sabe."],
            ["¿Quién mantiene la base de respuestas?"],
            "Los asesores responden muchas preguntas repetidas: horarios, requisitos, precios. Quieren un asistente que responda lo básico."),

        ["Descarga de comprobantes de SUNAT"] = new(
            "Descargar a diario los comprobantes electrónicos recibidos desde SUNAT, para que Contabilidad los tenga completos sin entrar al portal.",
            "Cubre facturas y notas recibidas. No cubre comprobantes emitidos.",
            ["Portal de SUNAT (SOL)", "Carpeta compartida"],
            ["Comprobantes recibidos en SUNAT"],
            ["Comprobantes descargados y ordenados", "Reporte diario de descargas"],
            ["El asistente ingresa a SUNAT con la clave SOL.", "Consulta los comprobantes recibidos.", "Descarga cada XML y PDF.", "Los guarda en carpetas por mes."],
            ["Se descargan todos los comprobantes del día anterior."],
            ["SUNAT no responde → el bot reintenta más tarde y avisa."],
            ["El bot ingresa a SUNAT cada mañana con la clave SOL de la Bóveda.", "Descarga los comprobantes del día anterior.", "Los guarda ordenados.", "Envía el reporte de descargas."],
            ["¿En qué carpeta se guardan los comprobantes?", "¿Qué usuario SOL usará el bot?"],
            "Un asistente entra cada día a SUNAT a descargar comprobantes recibidos y los ordena en carpetas. Toma más de una hora diaria."),

        ["Reportes regulatorios"] = new(
            "Preparar los reportes regulatorios periódicos a partir de los datos del ERP, para entregarlos a tiempo y sin errores de transcripción.",
            "Cubre la preparación de los reportes. No cubre su presentación ni su firma.",
            ["ERP", "Excel"],
            ["Datos contables y operativos del ERP"],
            ["Reportes en el formato exigido"],
            ["El analista exporta los datos del ERP.", "Los ordena en las plantillas del regulador.", "Revisa totales.", "Los entrega para presentación."],
            ["Los reportes se presentan dentro del plazo de cada regulador."],
            ["Los totales no cuadran → queda para revisión del analista."],
            ["El proceso extrae los datos del ERP.", "Llena las plantillas.", "Valida totales.", "Deja los reportes listos para revisión."],
            ["¿Qué reportes y plazos aplican?", "¿Las plantillas cambian cada año?"],
            "Los reportes se arman a mano en Excel cada mes. Toman varios días y hay riesgo de errores de transcripción."),
    };
}
