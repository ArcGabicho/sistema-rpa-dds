export type PrivacySection = {
  title: string;
  body: string;
};

export const PRIVACY_LAST_UPDATED = "4 de agosto de 2025";

export const PRIVACY_INTRO =
  'En Data Discovery Solutions S.A.C. ("DDS"), respetamos su privacidad y nos comprometemos a proteger los datos personales que nos confía. Esta política está alineada con la Ley N.° 29733 – Ley de Protección de Datos Personales del Perú y su reglamento.';

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: "1. Responsable del tratamiento",
    body: "El responsable del tratamiento de sus datos es Data Discovery Solutions S.A.C., con domicilio en Lima - Perú. Para cualquier solicitud relacionada, puede escribirnos a discovery@dds.pe.",
  },
  {
    title: "2. Datos recopilados",
    body: "Recolectamos datos como nombre, correo electrónico, número telefónico, cargo, empresa, IP, navegador y cualquier información necesaria para prestar nuestros servicios de automatización, inteligencia artificial y análisis de datos.",
  },
  {
    title: "3. Finalidad del tratamiento",
    body: "Usamos sus datos para: gestionar proyectos, brindar soporte, enviar invitaciones a reuniones, emitir reportes, coordinar propuestas y mejorar nuestros servicios.",
  },
  {
    title: "4. Base legal",
    body: "El tratamiento de sus datos se basa en su consentimiento libre e informado, así como en la necesidad contractual para la prestación de servicios.",
  },
  {
    title: "5. Plazo de conservación",
    body: "Conservaremos sus datos únicamente mientras sean necesarios para cumplir con las finalidades declaradas o requerimientos legales aplicables.",
  },
  {
    title: "6. Transferencia internacional",
    body: "En algunos casos, sus datos pueden ser tratados mediante servicios en la nube fuera del Perú (como Microsoft, OpenAI, Google Cloud). Estas transferencias se realizan conforme a lo permitido por la normativa vigente.",
  },
  {
    title: "7. Derechos del titular",
    body: "Usted tiene derecho a acceder, rectificar, cancelar u oponerse (derechos ARCO) al tratamiento de sus datos. Para ejercerlos, contáctenos a discovery@dds.pe. También puede acudir a la Autoridad Nacional de Protección de Datos Personales si considera vulnerados sus derechos.",
  },
  {
    title: "8. Uso de cookies",
    body: "Este sitio puede utilizar cookies para mejorar su experiencia. Puede desactivarlas desde su navegador si lo desea.",
  },
  {
    title: "9. Cambios a esta política",
    body: "DDS podrá modificar esta política cuando sea necesario. Las versiones actualizadas estarán disponibles en esta página.",
  },
];
