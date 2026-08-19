/**
 * Datos de ejemplo para la bandeja de correo del Gestor (solo UI, sin envío ni
 * recepción real: no hay proveedor de correo integrado todavía). El objetivo
 * de esta pantalla es mostrar cómo se vería la bandeja, no moverla.
 */

export type Correo = {
  id: string;
  remitente: string;
  correoRemitente: string;
  iniciales: string;
  asunto: string;
  extracto: string;
  cuerpo: string;
  fecha: string;
  leido: boolean;
  etiquetas: string[];
};

export function obtenerCorreosMock(): Correo[] {
  return [
    {
      id: "c1",
      remitente: "Laura Restrepo",
      correoRemitente: "laura.restrepo@asociado.com",
      iniciales: "LR",
      asunto: "Reunión mañana para revisar la propuesta",
      extracto:
        "Hola, quisiera confirmar la reunión de mañana para revisar los detalles de la propuesta comercial...",
      cuerpo:
        "Hola,\n\nQuisiera confirmar la reunión de mañana para revisar los detalles de la propuesta comercial. He estado revisando la información que me compartiste y tengo algunas preguntas sobre el plan de pagos.\n\n¿Podríamos vernos a las 10:00 a.m.? Quedo atenta.\n\nSaludos,\nLaura",
      fecha: "Hoy, 9:14 a.m.",
      leido: false,
      etiquetas: ["prospección", "importante"],
    },
    {
      id: "c2",
      remitente: "Carlos Mendoza",
      correoRemitente: "carlos.mendoza@asociado.com",
      iniciales: "CM",
      asunto: "Re: Cotización producto plan familiar",
      extracto:
        "Gracias por el envío de la cotización, la revisé con mi familia y tenemos un par de dudas...",
      cuerpo:
        "Gracias por el envío de la cotización, la revisé con mi familia y tenemos un par de dudas sobre la cobertura adicional.\n\n¿Me puedes confirmar si aplica para dependientes mayores de 25 años?\n\nQuedo pendiente.",
      fecha: "Hoy, 8:02 a.m.",
      leido: false,
      etiquetas: ["cotización"],
    },
    {
      id: "c3",
      remitente: "Want Get · Sistema",
      correoRemitente: "notificaciones@wantget.com",
      iniciales: "WG",
      asunto: "Recordatorio: cierre de mes comercial",
      extracto:
        "Este es un recordatorio automático: el cierre del periodo comercial vigente es el día 30...",
      cuerpo:
        "Este es un recordatorio automático: el cierre del periodo comercial vigente es el día 30. Verifica que todas tus oportunidades en curso estén actualizadas antes de esa fecha.",
      fecha: "Ayer, 6:45 p.m.",
      leido: true,
      etiquetas: ["sistema"],
    },
    {
      id: "c4",
      remitente: "Andrea Salazar",
      correoRemitente: "andrea.salazar@asociado.com",
      iniciales: "AS",
      asunto: "Documentos firmados",
      extracto:
        "Buenas tardes, adjunto los documentos firmados que me solicitaste la semana pasada...",
      cuerpo:
        "Buenas tardes,\n\nAdjunto los documentos firmados que me solicitaste la semana pasada. Cualquier cosa adicional que necesites, me avisas.\n\nGracias por tu acompañamiento.",
      fecha: "Ayer, 2:17 p.m.",
      leido: true,
      etiquetas: ["prospección"],
    },
    {
      id: "c5",
      remitente: "Jorge Iván Pérez",
      correoRemitente: "jorge.perez@asociado.com",
      iniciales: "JP",
      asunto: "Consulta sobre beneficios adicionales",
      extracto:
        "Buen día, me gustaría saber si el plan incluye algún beneficio adicional para...",
      cuerpo:
        "Buen día,\n\nMe gustaría saber si el plan incluye algún beneficio adicional para el segundo año de vinculación. Un colega me comentó que existían descuentos por permanencia.\n\nQuedo atento.",
      fecha: "Lunes, 11:30 a.m.",
      leido: true,
      etiquetas: [],
    },
  ];
}
