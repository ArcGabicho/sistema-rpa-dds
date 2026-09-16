import {
  ArrowLeftRight,
  BrainCircuit,
  Bot,
  ChartColumn,
  Database,
  FileScan,
  FileSpreadsheet,
  FileText,
  ScanText,
  Server,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ServiceHighlight = {
  title: string;
  description: string;
};

export type ServicePillar = {
  title: string;
  description: string;
};

export type ServiceStep = {
  title: string;
  description: string;
};

export type ServiceUseCase = {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
};

export type Service = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  heroSubtitle: string;
  introHeading: string;
  introBody: string[];
  highlights: ServiceHighlight[];
  pillarsHeading: string;
  pillarsIntro: string;
  pillars: ServicePillar[];
  useCasesHeading: string;
  useCasesIntro: string;
  useCases: ServiceUseCase[];
  stepsHeading: string;
  steps: ServiceStep[];
};

export const SERVICES: Service[] = [
  {
    slug: "analitica-de-datos",
    title: "Analítica de Datos",
    description:
      "Soluciones para analizar, modelar y visualizar información clave en tu negocio.",
    icon: ChartColumn,
    features: [
      "Dashboards con Power BI, Qlik, Looker",
      "Conexión a ERP, Excel, Google Sheets, APIs",
      "Automatización de reportes e indicadores",
      "Análisis predictivo y segmentación de clientes",
    ],
    heroSubtitle:
      "Impulsa decisiones inteligentes con dashboards personalizados, reportes dinámicos y modelos predictivos.",
    introHeading: "Impulsa tu empresa con decisiones basadas en datos reales.",
    introBody: [
      "Nuestros servicios de Analítica de Datos convierten la información dispersa de tus sistemas en dashboards estratégicos, modelos predictivos y reportes automáticos. Tomamos lo complejo y lo transformamos en claridad visual para que tomes mejores decisiones, más rápido.",
      "Desde ventas y finanzas hasta logística y atención al cliente, diseñamos soluciones analíticas a medida con Power BI, Qlik y Looker.",
    ],
    highlights: [
      {
        title: "Menos incertidumbre, más decisiones basadas en datos",
        description: "Visualiza lo que está pasando, detecta riesgos y actúa a tiempo.",
      },
      {
        title: "Reportes en segundos, no en horas",
        description:
          "Automatiza la generación de KPIs y evita el trabajo repetitivo de Excel.",
      },
      {
        title: "Inteligencia estratégica a tu medida",
        description: "Diseñamos dashboards y modelos según los objetivos de tu negocio.",
      },
    ],
    pillarsHeading:
      "Los cuatro pilares de una estrategia analítica que transforma decisiones",
    pillarsIntro:
      "Creamos soluciones que convierten tus datos en ventajas competitivas. Desde la captura hasta la visualización, alineamos tecnología y negocio para que tomes mejores decisiones, más rápido.",
    pillars: [
      {
        title: "Integración de Datos",
        description:
          "Conectamos tus fuentes en un solo flujo confiable. Unificamos Excel, ERPs, CRMs y plataformas web para que trabajes con información completa, actualizada y sin errores.",
      },
      {
        title: "Modelado de Negocio",
        description:
          "Diseñamos modelos lógicos que reflejan tu realidad operativa. Desde ingresos hasta rentabilidad por tienda o canal, estructuramos los datos según tus KPIs.",
      },
      {
        title: "Visualización Inteligente",
        description:
          "Dashboards que responden a preguntas clave del negocio. Power BI, Qlik o Looker con gráficos accionables, alertas y filtros dinámicos para cada usuario.",
      },
      {
        title: "Escalabilidad",
        description:
          "Reportes automáticos. Procesos sin intervención manual. Reduces horas de trabajo repetitivo y escalas tus análisis en toda la organización sin depender de Excel.",
      },
    ],
    useCasesHeading: "Impulsamos decisiones con datos, no con suposiciones",
    useCasesIntro:
      "¿Tienes información en Excel, SAP, sistemas internos o CRMs, pero no sabes cómo integrarla ni visualizarla? Creamos soluciones analíticas personalizadas para cada área de tu negocio: ventas, finanzas, logística, marketing y más.",
    useCases: [
      {
        icon: ChartColumn,
        title: "Dashboards Estratégicos",
        description:
          "Creamos dashboards personalizados para cada perfil (Gerencia, Finanzas, Ventas, Operaciones), utilizando Power BI, Qlik Sense o Looker Studio. No es solo visualización: es dirección.",
        bullets: [
          "Cuadros de mando gerenciales con alertas",
          "KPIs clave: ventas, márgenes, productividad, rotación",
          "Segmentación dinámica (fecha, canal, región, tienda)",
          "Drill-down y análisis comparativo",
          "Publicación en la nube o embed en intranet",
        ],
      },
      {
        icon: FileSpreadsheet,
        title: "Automatización de Reportes",
        description:
          "Conectamos tus fuentes (Excel, SAP, Google Sheets, ERPs, APIs) y automatizamos todo el flujo: desde la carga de datos hasta el envío del reporte final.",
        bullets: [
          "Conectores automáticos a múltiples fuentes",
          "Transformación de datos con Power Query / Qlik Load Script",
          "Actualización programada",
          "Envío automático por correo o Teams",
          "Exportación en PDF / Excel / PowerPoint",
        ],
      },
      {
        icon: Database,
        title: "Integración de Datos",
        description:
          "Consolidamos datos de sistemas dispares (ventas, finanzas, CRM, RRHH) en modelos robustos y escalables. Sin duplicados, sin errores.",
        bullets: [
          "Conexiones a SAP, Excel, SQL Server, APIs REST",
          "Modelos lógicos en Power BI / Qlik / Looker",
          "Detección de inconsistencias",
          "Creación de catálogos de datos",
          "Gobernanza: control de acceso, trazabilidad",
        ],
      },
      {
        icon: TrendingUp,
        title: "Analítica Financiera Avanzada",
        description:
          "Desarrollamos soluciones financieras avanzadas con Power BI, Qlik o Looker para que veas mucho más que balances: te entregamos control, simulación y visión estratégica.",
        bullets: [
          "Dashboards de flujo de caja proyectado y real",
          "Proyección de ingresos y gastos por semana/mes",
          "Aging inteligente de cuentas por cobrar y pagar",
          "Análisis de rentabilidad por producto, canal o cliente",
          "Simulación de escenarios (“¿Qué pasa si…?”)",
          "Integración con ERP (SAP, Odoo, Contasis, etc.)",
        ],
      },
    ],
    stepsHeading: "Nuestro proceso para llevar tus datos al siguiente nivel",
    steps: [
      {
        title: "Agenda un diagnóstico gratuito",
        description:
          "Revisamos tus fuentes actuales (Excel, ERP, SAP, etc.) y entendemos tus retos de negocio.",
      },
      {
        title: "Diseño del roadmap analítico",
        description:
          "Definimos KPIs clave, tipo de visualizaciones, periodicidad y roles. Propuesta visual y funcional.",
      },
      {
        title: "Validación técnica y aprobación",
        description:
          "Integramos tus datos reales en Power BI / Qlik / Looker para que veas el valor antes de decidir.",
      },
      {
        title: "Entrega, formación y escalamiento",
        description:
          "Capacitamos a tus equipos y automatizamos la actualización de reportes para escalar sin fricciones.",
      },
    ],
  },
  {
    slug: "automatizacion-rpa",
    title: "Automatización RPA",
    description:
      "Implementamos robots que replican tareas repetitivas con precisión y rapidez.",
    icon: Workflow,
    features: [
      "Desarrollo de bots con Rocketbot",
      "Validación y procesamiento de documentos",
      "Automatización de flujos en Excel, SAP, Oracle",
      "Conciliaciones, alertas y ejecución programada",
    ],
    heroSubtitle:
      "Automatiza tareas repetitivas, reduce errores y libera el tiempo de tu equipo para lo que realmente importa.",
    introHeading: "Automatización inteligente para operaciones críticas 24/7",
    introBody: [
      "En DDS automatizamos procesos repetitivos, manuales o críticos con robots de software (RPA) desarrollados en Rocketbot. Creamos soluciones personalizadas que actúan sobre tus sistemas existentes —como Oracle Cloud, SAP, Excel, web o carpetas locales— sin necesidad de cambiar tu infraestructura. Nuestros bots ejecutan validaciones, registros, extracciones de datos y envío de reportes con precisión y sin interrupciones.",
      "Actuamos como una extensión de tu equipo: analizamos el proceso actual, proponemos mejoras, desarrollamos el bot y lo dejamos operativo con manuales y soporte incluido.",
    ],
    highlights: [
      {
        title: "Menos Riesgo Operativo",
        description:
          "Automatiza tareas críticas con bots que no se cansan ni se equivocan. Disminuye los errores humanos en validaciones, cálculos y registros diarios.",
      },
      {
        title: "Procesos Rápidos, sin demoras",
        description:
          "Tus bots trabajan 24/7 sin interrupciones. Genera reportes, carga facturas o valida depósitos en minutos, no horas.",
      },
      {
        title: "Automatización Inteligente con Acompañamiento",
        description:
          "No solo desarrollamos bots: entendemos tu proceso, lo optimizamos y lo dejamos documentado. Te acompañamos desde el diseño hasta la puesta en producción.",
      },
    ],
    pillarsHeading: "Los cuatro pilares de nuestra Automatización RPA",
    pillarsIntro:
      "En DDS diseñamos e implementamos bots que operan procesos críticos con rapidez, precisión y sin errores. Nuestra metodología garantiza automatización real, con impacto medible desde el primer mes.",
    pillars: [
      {
        title: "Diagnóstico y Priorización",
        description:
          "Identificamos tareas repetitivas que consumen tiempo y recursos, y construimos el roadmap de automatización sin modificar tu sistema actual.",
      },
      {
        title: "Desarrollo Ágil de Bots",
        description:
          "Desde la lectura de archivos hasta la interacción con SAP, Excel o plataformas web, los bots operan con lógica validada y trazabilidad.",
      },
      {
        title: "Implementación + Validación Funcional",
        description:
          "Incluimos documentación, manuales, marcha blanca y validación con usuarios finales.",
      },
      {
        title: "Ejecución + Escalamiento",
        description:
          "Una vez operativo, el bot puede clonarse y adaptarse a nuevas áreas o locales. El ROI se multiplica sin licencias innecesarias.",
      },
    ],
    useCasesHeading: "Automatiza procesos reales con bots que ejecutan, validan y reportan",
    useCasesIntro:
      "Desarrollamos soluciones RPA con Rocketbot para digitalizar tareas repetitivas sin modificar tus sistemas. Nuestros bots operan en SAP, Excel, plataformas web, carpetas y APIs.",
    useCases: [
      {
        icon: ScanText,
        title: "Carga de documentos y validaciones SUNAT",
        description:
          "Automatizamos el flujo completo de carga de documentos: lectura, verificación de RUC, validación en SUNAT, registro en Excel o SAP, y respaldo automático.",
        bullets: [
          "Extracción desde carpetas, correos o OCR",
          "Validación en SUNAT, AFPNet o ONP",
          "Registro estandarizado en formato cliente",
          "Respaldo en Google Drive o red local",
          "Alertas de documentos con error",
        ],
      },
      {
        icon: ArrowLeftRight,
        title: "Conciliación de depósitos y ventas",
        description:
          "Robots que verifican, cruzan y concilian montos entre bancos, vouchers de venta y reportes del ERP. Detectan diferencias y generan resumen para SAP o contabilidad.",
        bullets: [
          "Lectura de depósitos bancarios",
          "Extracción de vouchers desde carpetas compartidas",
          "Comparación por tienda, fecha y operación",
          "Generación de reporte conciliado",
          "Exportación en Excel y TXT para SAP",
        ],
      },
      {
        icon: FileText,
        title: "Generación de reportes automáticos",
        description:
          "Bots que arman reportes a partir de múltiples fuentes (Excel, web, SQL, PDFs) y los entregan listos en PDF, Excel o por correo.",
        bullets: [
          "Extracción diaria o semanal de datos",
          "Cruce de información histórica + actual",
          "Generación de archivo con tablas y cálculos",
          "Envío automático a áreas usuarias",
          "Compatibilidad con Power BI y Google Sheets",
        ],
      },
      {
        icon: Server,
        title: "Extracción y registro en sistemas",
        description:
          "Nuestros bots navegan por portales web, ERP o carpetas internas, extraen datos, los validan y los registran en Oracle Cloud, SAP, Excel o sistemas propios.",
        bullets: [
          "Lectura web o carpetas compartidas",
          "Login seguro + búsqueda por número de operación",
          "Ingreso de datos a campos específicos",
          "Verificación de campos requeridos",
          "Registro de log de ejecución",
        ],
      },
    ],
    stepsHeading: "Así implementamos tu robot de automatización RPA en 4 pasos",
    steps: [
      {
        title: "Identificamos el proceso ideal para automatizar",
        description:
          "Revisamos tus tareas operativas, validamos volumen, repetitividad y reglas de negocio. Luego seleccionamos el proceso con mejor retorno en corto plazo.",
      },
      {
        title: "Te mostramos un prototipo funcional",
        description:
          "Creamos una versión inicial del bot con tus propios datos. Lo probamos contigo en entorno de prueba para que visualices su funcionamiento antes de comprometerte.",
      },
      {
        title: "Desarrollamos y validamos el flujo completo",
        description:
          "Construimos el bot con Rocketbot, aplicamos lógica de negocio, manejamos excepciones y preparamos el entorno. Validamos con usuarios finales antes de ir a producción.",
      },
      {
        title: "Activamos, documentamos y damos soporte",
        description:
          "Ejecutamos el bot, documentamos cada paso y capacitamos a tus usuarios. Incluye respaldo automático, logs de ejecución, alertas y manuales operativos.",
      },
    ],
  },
  {
    slug: "inteligencia-artificial",
    title: "Inteligencia Artificial (IA)",
    description:
      "Usamos IA generativa, OCR y lógica avanzada para interpretar y actuar sobre los datos.",
    icon: BrainCircuit,
    features: [
      "Validación de documentos con GPT",
      "Extracción de texto e interpretación de vouchers",
      "Asistentes virtuales para áreas operativas",
      "Detección de patrones y análisis automatizado",
    ],
    heroSubtitle:
      "Integramos IA generativa a tus procesos para automatizar decisiones, responder con criterio y liberar tiempo real a tu equipo.",
    introHeading: "Soluciones de IA que entienden lenguaje y ejecutan procesos con criterio.",
    introBody: [
      "En DDS integramos modelos de lenguaje (LLMs) en tus procesos operativos, administrativos y analíticos para convertir información no estructurada (correos, PDFs, textos, formularios) en acciones medibles. Creamos asistentes inteligentes capaces de interpretar y clasificar correos, validar documentos, resumir y redactar respuestas, extraer datos, completar formularios y tomar decisiones basadas en reglas dentro de un flujo automatizado.",
      "Esto lleva la automatización al siguiente nivel: ya no solo automatizas tareas, habilitas bots con lenguaje natural, trazabilidad y control. Trabajamos bajo un enfoque de hiperautomatización, combinando IA + RPA + datos para lograr eficiencia real y escalable.",
    ],
    highlights: [
      {
        title: "Menos carga operativa, más foco estratégico",
        description:
          "Automatizamos tareas cognitivas como redacción, validación, clasificación o análisis textual, liberando tiempo valioso de tu equipo.",
      },
      {
        title: "Procesos más rápidos, con lenguaje natural",
        description:
          "Con IA, tus bots no solo ejecutan: también interpretan, responden y resumen información en segundos. Ideal para inbox, tickets, validaciones, documentos o formularios.",
      },
      {
        title: "Asistencia inteligente 24/7, integrada a tu RPA",
        description:
          "Creamos agentes virtuales entrenados para apoyar procesos clave. Los conectamos a tus bots de Rocketbot o plataformas internas para escalar tu operación sin aumentar personal.",
      },
    ],
    pillarsHeading:
      "Los cuatro pilares de nuestra estrategia de Automatización Inteligente",
    pillarsIntro:
      "Nuestra propuesta combina automatización inteligente, modelos generativos y analítica avanzada para transformar tus operaciones con precisión y escalabilidad.",
    pillars: [
      {
        title: "Asistentes con GPT Integrado",
        description:
          "Creamos agentes inteligentes capaces de leer, interpretar y responder correos, incidentes o formularios, mejorando la atención al cliente o soporte interno.",
      },
      {
        title: "Bots de IA + RPA",
        description:
          "Desarrollamos robots que no solo automatizan tareas, sino que “piensan”: toman decisiones según reglas de negocio, validan documentos y redactan reportes automáticamente.",
      },
      {
        title: "Validación Documental Inteligente",
        description:
          "Extraemos y validamos datos desde PDFs, vouchers y formularios usando OCR + IA, conectando con SUNAT, portales web o sistemas internos sin intervención manual.",
      },
      {
        title: "Análisis Predictivo y Diagnóstico Financiero",
        description:
          "Implementamos modelos que interpretan datos de ventas, gastos o flujo de caja. Detectamos anomalías, predecimos eventos críticos y sugerimos decisiones en tiempo real.",
      },
    ],
    useCasesHeading: "Automatización Inteligente de Decisiones",
    useCasesIntro:
      "Creamos soluciones que combinan RPA + IA Generativa + análisis predictivo para liberar tiempo operativo, reducir errores humanos y tomar decisiones más rápidas basadas en datos reales.",
    useCases: [
      {
        icon: Bot,
        title: "Automatización Cognitiva con RPA + IA",
        description:
          "Automatizamos procesos que antes requerían criterio humano, combinando RPA con inteligencia artificial para decisiones autónomas.",
        bullets: [
          "Clasificación inteligente de documentos y correos",
          "Validación automática de datos (SUNAT, SAP, CRM, etc.)",
          "Generación de archivos y reportes en formatos específicos",
          "Automatización multicanal (correo, carpetas, APIs, etc.)",
        ],
      },
      {
        icon: Sparkles,
        title: "IA Generativa Aplicada a Negocios",
        description:
          "Implementamos modelos de lenguaje (LLMs) para generar contenido, redactar insights y asistir en procesos complejos con lenguaje natural. Integramos IA generativa en flujos reales para que tu operación gane velocidad, consistencia y trazabilidad.",
        bullets: [
          "Redacción asistida de correos, contratos y respuestas (con plantillas y validaciones)",
          "Clasificación de texto y sentimiento para priorizar casos y enrutar solicitudes",
          "Agentes de IA para soporte, auditoría interna o ventas (con reglas y escalamiento)",
          "Integración con Power Automate, Python o plataformas RPA",
        ],
      },
      {
        icon: TrendingUp,
        title: "Modelos Predictivos y Analítica Avanzada",
        description:
          "Diseñamos modelos de IA para anticipar escenarios críticos y mejorar decisiones con datos. Construimos soluciones predictivas y analítica avanzada para transformar información histórica en proyecciones, alertas y planes de acción.",
        bullets: [
          "Simuladores de flujo de caja con IA: escenarios what-if, fechas críticas y recomendaciones",
          "Alertas de riesgo financiero: patrones, anomalías y desviaciones relevantes",
          "Forecast de demanda, ventas e inventario: proyección y drivers del negocio",
          "Modelado e implementación a medida en Python, Power BI o Qlik",
        ],
      },
      {
        icon: FileScan,
        title: "Extracción Inteligente de Datos (OCR + IA)",
        description:
          "Digitalizamos y estructuramos grandes volúmenes de información con motores de OCR y lógica de IA contextual.",
        bullets: [
          "Lectura masiva de vouchers, formularios o PDFs",
          "Extracción de campos y validación por reglas de negocio",
          "Generación automática de JSON, Excel o base de datos",
          "Integración con bots RPA y sistemas contables o ERP",
        ],
      },
    ],
    stepsHeading: "Así llevamos la automatización y la IA a tu empresa, paso a paso",
    steps: [
      {
        title: "Diagnóstico Estratégico",
        description:
          "Identificamos procesos repetitivos, cuellos de botella o áreas donde la inteligencia artificial puede generar valor inmediato.",
      },
      {
        title: "Simulación de Impacto con IA",
        description: "Usamos un modelo propio para estimar ahorro, ROI y escenarios posibles.",
      },
      {
        title: "Propuesta Personalizada",
        description:
          "Presentamos una solución a medida: desde bots RPA con lógica de IA hasta asistentes GPT entrenados en tu negocio.",
      },
      {
        title: "Implementación y Acompañamiento",
        description:
          "Automatizamos, validamos con el usuario y entrenamos a tu equipo. No solo entregamos tecnología: te ayudamos a liderar el cambio.",
      },
    ],
  },
];

export function getServiceBySlug(slug: string) {
  return SERVICES.find((service) => service.slug === slug);
}
