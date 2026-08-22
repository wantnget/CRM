import { randomUUID } from "node:crypto";

/**
 * Envío del OTP por WhatsApp vía Truora (responde PA-12: el proveedor).
 *
 * El spec guarda `usuario.telefono_whatsapp` en formato E.164
 * ("+573001234567"), pero la API de Truora recibe el indicativo y el número
 * nacional por separado, así que aquí se parte.
 */

const INDICATIVO_POR_DEFECTO = "+57";

type TelefonoE164 = { countryCode: string; nationalNumber: string };

/**
 * Parte un teléfono E.164 en indicativo + número nacional. Acepta números sin
 * indicativo (asume Colombia) para tolerar datos cargados sin normalizar.
 */
export function partirTelefonoE164(telefono: string): TelefonoE164 {
  const limpio = telefono.replace(/[\s()-]/g, "");

  if (limpio.startsWith("+57")) {
    return { countryCode: "+57", nationalNumber: limpio.slice(3) };
  }

  if (limpio.startsWith("+")) {
    // Indicativo desconocido: se toman los primeros 1-3 dígitos como país.
    const match = /^\+(\d{1,3})(\d+)$/.exec(limpio);
    if (match) {
      return { countryCode: `+${match[1]}`, nationalNumber: match[2] };
    }
  }

  return { countryCode: INDICATIVO_POR_DEFECTO, nationalNumber: limpio };
}

/**
 * Dispara una plantilla de WhatsApp por Truora. Es el único envío permitido
 * cuando no hay ventana de atención abierta: WhatsApp no admite texto libre
 * hasta que el contacto responde.
 */
async function enviarOutbound({
  telefono,
  outboundId,
  variables = {},
}: {
  telefono: string;
  outboundId: string;
  /** Variables de la plantilla, sin el prefijo `var.`. */
  variables?: Record<string, string>;
}) {
  const { countryCode, nationalNumber } = partirTelefonoE164(telefono);

  const body = new URLSearchParams({
    phone_number: nationalNumber,
    country_code: countryCode,
    outbound_id: outboundId,
    flow_id: "",
    user_authorized: "true",
    preserve_last_outbound: "false",
  });

  for (const [nombre, valor] of Object.entries(variables)) {
    body.set(`var.${nombre}`, valor);
  }

  const response = await fetch(process.env.API_OUTPUT_TRUORA!, {
    method: "POST",
    headers: {
      "Truora-API-Key": process.env.API_KEY_TRUORA!,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const detalle = await response.text();
    // RN-26: el contenido de la plantilla no debe quedar en logs.
    throw new Error(`Truora WhatsApp send failed (${response.status}): ${detalle}`);
  }
}

export async function sendWhatsAppOTP(telefono: string, code: string) {
  await enviarOutbound({
    telefono,
    outboundId: process.env.TRUORA_OUTBOUND_ID!,
    variables: { code },
  });
}

/**
 * Abre la conversación con el asociado. La plantilla de mensaje libre no lleva
 * variables: su único papel es habilitar la ventana de 24 h para que después se
 * pueda escribir texto libre por /engagement/chat.
 */
export async function abrirConversacionWhatsApp(telefono: string) {
  await enviarOutbound({
    telefono,
    outboundId: process.env.TRUORA_OUTBOUND_ID_MENSAJE_LIBRE!,
  });
}

// --------------------------------------------------------- engagement / chat

const URL_BUSCAR_CHAT =
  "https://api.identity.truora.com/v1/engagement/chat/search";

type ChatTruora = {
  chat_id: string;
  status: string;
  latest_session_ttl: number;
  details: { contact_phone_number: string };
};

/** Encabezados de las llamadas autenticadas a Truora. */
function cabeceras(extra: Record<string, string> = {}) {
  return { "Truora-API-Key": process.env.API_KEY_TRUORA!, ...extra };
}

function soloDigitos(telefono: string): string {
  return telefono.replace(/\D/g, "");
}

const VENTANA_HORAS = 24;

/**
 * Fin de la ventana de atención.
 *
 * `latest_session_ttl` es un epoch en segundos, pero en la práctica llega en 0
 * incluso con el chat abierto, así que cuando falta se estima con las 24 h que
 * concede WhatsApp. Un chat cerrado no tiene ventana.
 */
function ventanaDe(chat: ChatTruora): Date | null {
  if (chat.latest_session_ttl > 0) {
    return new Date(chat.latest_session_ttl * 1000);
  }

  return chat.status === "open"
    ? new Date(Date.now() + VENTANA_HORAS * 60 * 60 * 1000)
    : null;
}

export type ChatWhatsapp = {
  chatId: string;
  ventanaExpiraAt: Date | null;
};

/**
 * Busca el chat del contacto para poder escribirle texto libre. Devuelve `null`
 * cuando Truora todavía no tiene chat con ese número, que es lo que pasa antes
 * de que el asociado conteste la plantilla.
 */
export async function buscarChatWhatsapp(
  telefono: string,
): Promise<ChatWhatsapp | null> {
  const url = new URL(URL_BUSCAR_CHAT);
  // `contact_query` busca por nombre o por teléfono. Va sin el "+": con el
  // indicativo prefijado la búsqueda no encuentra el contacto.
  url.searchParams.set("contact_query", soloDigitos(telefono));

  const response = await fetch(url, { headers: cabeceras() });

  // 404 es "todavía no hay chat con este contacto", no una falla.
  if (response.status === 404) return null;

  if (!response.ok) {
    const detalle = await response.text();
    throw new Error(`Truora chat search failed (${response.status}): ${detalle}`);
  }

  const { chats } = (await response.json()) as { chats: ChatTruora[] | null };

  // `contact_query` también busca por nombre, así que se confirma el teléfono
  // por dígitos para no escribirle al contacto equivocado.
  const digitos = soloDigitos(telefono);
  const delContacto = (chats ?? []).filter(
    (chat) => soloDigitos(chat.details?.contact_phone_number ?? "") === digitos,
  );

  const chat =
    delContacto.find((c) => c.status === "open") ?? delContacto[0] ?? null;

  return chat ? { chatId: chat.chat_id, ventanaExpiraAt: ventanaDe(chat) } : null;
}

/**
 * Envía un mensaje dentro de la ventana de 24 h ya abierta.
 *
 * `request_id` es la llave de idempotencia de Truora, con el formato
 * `{chat_id}_PND_ACT_{uuid}`, y `current_username` identifica al operador que
 * escribe: es el correo del gestor, no una credencial de la aplicación. El
 * objeto `whatsapp` es el mismo de la API de WhatsApp Cloud.
 */
async function enviarAlChat({
  chatId,
  usuario,
  whatsapp,
}: {
  chatId: string;
  usuario: string;
  whatsapp: Record<string, unknown>;
}) {
  const url = process.env.API_SEND_MESSAGE_TRUORA!.replace("{chat_id}", chatId);

  const response = await fetch(url, {
    method: "POST",
    headers: cabeceras({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      chat_id: chatId,
      client_id: process.env.TRUORA_CLIENT_ID,
      request_id: `${chatId}_PND_ACT_${randomUUID()}`,
      whatsapp,
      current_username: usuario,
    }),
  });

  if (!response.ok) {
    const detalle = await response.text();
    throw new Error(`Truora chat send failed (${response.status}): ${detalle}`);
  }
}

export async function enviarMensajeWhatsapp({
  chatId,
  cuerpo,
  usuario,
}: {
  chatId: string;
  cuerpo: string;
  usuario: string;
}) {
  await enviarAlChat({
    chatId,
    usuario,
    whatsapp: { type: "text", text: { body: cuerpo, preview_url: false } },
  });
}

