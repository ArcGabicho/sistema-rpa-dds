export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqGroup = {
  heading: string;
  intro: string;
  items: FaqItem[];
};

export const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Preguntas Frecuentes",
    intro: "Conoce cómo trabajamos y cómo podemos ayudarte a transformar tu negocio.",
    items: [
      {
        question: "¿Qué tipo de empresas trabajan con ustedes?",
        answer:
          "Trabajamos con empresas medianas y grandes de diversos sectores: hotelería, educación, retail, salud y logística. Nuestros clientes buscan eficiencia operativa, reducción de errores y una mejor toma de decisiones basada en datos.",
      },
      {
        question: "¿Cuál es el primer paso para iniciar un proyecto?",
        answer:
          "Todo comienza con una reunión de exploración gratuita. En ella entendemos tu proceso actual, tus retos y objetivos. Luego, te proponemos una solución a medida, ya sea con automatización, analítica o inteligencia artificial.",
      },
      {
        question: "¿Qué herramientas utilizan en sus soluciones?",
        answer:
          "Utilizamos herramientas líderes como Power BI, Qlik Sense, Rocketbot, Python y modelos GPT. Elegimos la combinación ideal según tu presupuesto, necesidades técnicas y el nivel de madurez digital de tu empresa.",
      },
      {
        question: "¿Cuánto tiempo toma implementar una solución RPA o BI?",
        answer:
          "Depende del proceso, pero muchos proyectos pueden implementarse en menos de 4 a 6 semanas. Contamos con desarrollos modulares que aceleran el tiempo de puesta en marcha.",
      },
      {
        question: "¿Pueden trabajar con nuestros sistemas actuales (ERP, CRM, etc.)?",
        answer:
          "Sí. Integramos nuestros bots y dashboards con sistemas como SAP, Oracle, Inforest, Salesforce y otros, sin necesidad de modificar tu infraestructura actual.",
      },
      {
        question: "¿Ofrecen soporte o mantenimiento posterior?",
        answer:
          "Claro. Ofrecemos soporte por bolsa de horas, monitoreo mensual y actualizaciones evolutivas. Así garantizamos que tu solución funcione bien a lo largo del tiempo.",
      },
      {
        question: "¿Puedo empezar con un piloto pequeño?",
        answer:
          "Sí. Muchos clientes comienzan con un piloto de bajo costo para validar la solución y medir el impacto antes de escalar. Nos adaptamos a tus tiempos y presupuesto.",
      },
      {
        question: "¿Los desarrollos pueden ser escalables o reutilizables en otras áreas?",
        answer:
          "Totalmente. Diseñamos soluciones reutilizables en finanzas, operaciones, ventas, logística y más. Usamos arquitecturas flexibles que permiten crecer sin rehacer.",
      },
      {
        question: "¿Mi información está segura con ustedes?",
        answer:
          "Sí. Aplicamos buenas prácticas de seguridad, cifrado, control de accesos y anonimización si es necesario. También firmamos acuerdos de confidencialidad (NDA) cuando el cliente lo solicita.",
      },
    ],
  },
  {
    heading: "Preguntas sobre nuestros servicios",
    intro: "Preguntas clave sobre nuestros proyectos, tecnologías y procesos.",
    items: [
      {
        question:
          "¿Qué requisitos técnicos necesita mi empresa para implementar sus soluciones?",
        answer:
          "Ninguno en especial. Adaptamos nuestras soluciones a tus sistemas existentes, ya sea en la nube, en servidores locales o entornos híbridos. No necesitas comprar nuevos servidores o infraestructura.",
      },
      {
        question: "¿Sus soluciones funcionan con mi ERP actual?",
        answer:
          "Sí. Tenemos experiencia integrando con SAP, Oracle Cloud, Inforest, Odoo, entre otros. Nuestros desarrollos se adaptan a tus sistemas sin reemplazarlos.",
      },
      {
        question: "¿Cuánto tiempo toma implementar un bot de RPA?",
        answer:
          "En promedio de 2 a 6 semanas, dependiendo del proceso y la validación interna del cliente. En casos de alta madurez digital, los pilotos pueden estar listos en menos de 10 días.",
      },
      {
        question: "¿Qué soporte brindan luego de la implementación?",
        answer:
          "Ofrecemos soporte por bolsa de horas, planes de mantenimiento y alertas automatizadas. Monitoreamos tus procesos y aplicamos mejoras continuas si lo deseas.",
      },
      {
        question: "¿Es posible automatizar procesos sin conocimientos técnicos?",
        answer:
          "Absolutamente. Nos encargamos de todo el desarrollo. Solo necesitamos que nos expliques el flujo del proceso, y nuestro equipo lo traduce a lógica automatizada.",
      },
      {
        question: "¿Qué tan seguras son sus soluciones de automatización o IA?",
        answer:
          "Muy seguras. Aplicamos cifrado, control de acceso y buenas prácticas en el tratamiento de datos. Si lo necesitas, también podemos ayudarte con cumplimiento de normativas (como ISO o Ley de Protección de Datos).",
      },
      {
        question: "¿Puedo empezar con un solo proceso y luego escalar?",
        answer:
          "Sí. Nuestros servicios son modulares y escalables. Puedes comenzar con un proceso clave (como conciliación, validación o reportes) y luego expandir a otras áreas.",
      },
    ],
  },
];

// Short excerpt shown inline on the homepage, linking out to the full /faq page.
export const FAQ_ITEMS: FaqItem[] = [
  FAQ_GROUPS[0].items[1],
  FAQ_GROUPS[0].items[3],
  FAQ_GROUPS[0].items[5],
  FAQ_GROUPS[0].items[8],
  FAQ_GROUPS[0].items[6],
];
