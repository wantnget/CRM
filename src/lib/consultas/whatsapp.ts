/**
 * Datos de ejemplo para la vista de WhatsApp del Gestor (solo UI: no hay
 * integración con la API de WhatsApp todavía). Sirve para mostrar cómo se
 * vería la conversación con un asociado dentro del CRM.
 */

export type MensajeChat = {
  id: string;
  autor: "gestor" | "contacto";
  texto: string;
  hora: string;
};

export type Chat = {
  id: string;
  nombre: string;
  iniciales: string;
  telefono: string;
  ultimoMensaje: string;
  hora: string;
  noLeidos: number;
  enLinea: boolean;
  mensajes: MensajeChat[];
};

export function obtenerChatsMock(): Chat[] {
  return [
    {
      id: "w1",
      nombre: "Laura Restrepo",
      iniciales: "LR",
      telefono: "+57 300 555 1234",
      ultimoMensaje: "Listos, nos vemos mañana entonces",
      hora: "9:41 a.m.",
      noLeidos: 2,
      enLinea: true,
      mensajes: [
        {
          id: "m1",
          autor: "contacto",
          texto: "Hola, buenas! ¿Cómo vamos con la propuesta?",
          hora: "9:20 a.m.",
        },
        {
          id: "m2",
          autor: "gestor",
          texto: "Hola Laura, todo en orden. Te la envié por correo esta mañana.",
          hora: "9:25 a.m.",
        },
        {
          id: "m3",
          autor: "contacto",
          texto: "Perfecto, la reviso y te cuento",
          hora: "9:30 a.m.",
        },
        {
          id: "m4",
          autor: "contacto",
          texto: "Listos, nos vemos mañana entonces",
          hora: "9:41 a.m.",
        },
      ],
    },
    {
      id: "w2",
      nombre: "Carlos Mendoza",
      iniciales: "CM",
      telefono: "+57 312 444 5678",
      ultimoMensaje: "¿Aplica para dependientes mayores de 25?",
      hora: "8:05 a.m.",
      noLeidos: 1,
      enLinea: false,
      mensajes: [
        {
          id: "m1",
          autor: "contacto",
          texto: "Buenas, ya revisé la cotización con mi familia",
          hora: "8:00 a.m.",
        },
        {
          id: "m2",
          autor: "contacto",
          texto: "¿Aplica para dependientes mayores de 25?",
          hora: "8:05 a.m.",
        },
      ],
    },
    {
      id: "w3",
      nombre: "Andrea Salazar",
      iniciales: "AS",
      telefono: "+57 320 987 6543",
      ultimoMensaje: "Gracias por todo",
      hora: "Ayer",
      noLeidos: 0,
      enLinea: false,
      mensajes: [
        {
          id: "m1",
          autor: "gestor",
          texto: "Andrea, ya me llegaron los documentos firmados. Todo en orden.",
          hora: "Ayer, 2:20 p.m.",
        },
        {
          id: "m2",
          autor: "contacto",
          texto: "Gracias por todo",
          hora: "Ayer, 2:25 p.m.",
        },
      ],
    },
    {
      id: "w4",
      nombre: "Jorge Iván Pérez",
      iniciales: "JP",
      telefono: "+57 315 222 3344",
      ultimoMensaje: "Quedo atento a la información",
      hora: "Lunes",
      noLeidos: 0,
      enLinea: true,
      mensajes: [
        {
          id: "m1",
          autor: "contacto",
          texto: "Buen día, ¿el plan tiene descuento por permanencia?",
          hora: "Lunes, 11:30 a.m.",
        },
        {
          id: "m2",
          autor: "gestor",
          texto: "Sí Jorge, te comparto el detalle en un momento.",
          hora: "Lunes, 11:40 a.m.",
        },
        {
          id: "m3",
          autor: "contacto",
          texto: "Quedo atento a la información",
          hora: "Lunes, 11:41 a.m.",
        },
      ],
    },
  ];
}
