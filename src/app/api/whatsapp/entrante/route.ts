import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook de WhatsApp entrante (Truora Engagement).
 *
 * El cuerpo no es JSON: es un JWS firmado cuyo payload trae `events`, un lote
 * de eventos. Del lote solo interesan los mensajes del contacto: son los que
 * abren la ventana de 24 h, así que además del texto se guardan `chat_id` y el
 * vencimiento de la sesión, que es lo que habilita responder con texto libre.
 */

const VENTANA_HORAS = 24;

type Desconocido = Record<string, unknown>;

type PayloadWebhook = {
  iss?: string;
  iat?: number;
  events?: Desconocido[];
};

type MensajeEntrante = {
  telefono: string;
  cuerpo: string;
  chatId: string | null;
  mensajeId: string | null;
  ventanaExpiraAt: Date | null;
};

/**
 * Verifica y decodifica el JWS. Sin `TRUORA_WEBHOOK_SIGNING_KEY` configurada
 * solo se decodifica, para poder probar en local antes de tener el secreto.
 */
function decodificarToken(token: string): PayloadWebhook | null {
  const partes = token.split(".");
  if (partes.length !== 3) return null;

  const [cabecera, cuerpo, firma] = partes;
  const secreto = process.env.TRUORA_WEBHOOK_SIGNING_KEY;

  if (secreto) {
    const esperada = createHmac("sha256", secreto)
      .update(`${cabecera}.${cuerpo}`)
      .digest("base64url");
    const a = Buffer.from(esperada);
    const b = Buffer.from(firma);

    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  }

  return JSON.parse(
    Buffer.from(cuerpo, "base64url").toString("utf8"),
  ) as PayloadWebhook;
}

/** Primer valor no vacío entre varias rutas posibles del evento. */
function buscar(evento: Desconocido, rutas: string[]): unknown {
  for (const ruta of rutas) {
    let valor: unknown = evento;
    for (const parte of ruta.split(".")) {
      if (valor === null || typeof valor !== "object") {
        valor = undefined;
        break;
      }
      valor = (valor as Desconocido)[parte];
    }
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return undefined;
}

const RUTAS_TELEFONO = [
  "object.user_phone_number",
  "details.contact_phone_number",
  "contact_phone_number",
];

const RUTAS_TEXTO = [
  "object.inbound_message",
  "payload.whatsapp.text.body",
  "payload.text.body",
  "text",
  "message",
];

const RUTAS_CHAT = ["object.chat_id", "chat_id"];

/** El id del evento identifica el mensaje: con él se descartan los reenvíos. */
const RUTAS_MENSAJE_ID = ["id", "activity_id", "message_id"];

const RUTAS_TTL = ["object.latest_session_ttl", "latest_session_ttl", "ttl"];

/** Rutas de las hojas del evento, sin valores: sirve para mapear formas nuevas. */
function rutasDe(valor: unknown, prefijo = ""): string[] {
  if (valor === null || typeof valor !== "object") return [prefijo];
  return Object.entries(valor as Desconocido).flatMap(([clave, anidado]) =>
    rutasDe(anidado, prefijo ? `${prefijo}.${clave}` : clave),
  );
}

function comoMensaje(evento: Desconocido): MensajeEntrante | null {
  const telefono = buscar(evento, RUTAS_TELEFONO);
  const cuerpo = buscar(evento, RUTAS_TEXTO);

  if (typeof telefono !== "string" || typeof cuerpo !== "string") return null;

  const chatId = buscar(evento, RUTAS_CHAT);
  const mensajeId = buscar(evento, RUTAS_MENSAJE_ID);
  const ttl = buscar(evento, RUTAS_TTL);

  return {
    telefono,
    cuerpo: cuerpo.trim(),
    chatId: typeof chatId === "string" ? chatId : null,
    mensajeId: typeof mensajeId === "string" ? mensajeId.slice(0, 120) : null,
    ventanaExpiraAt: typeof ttl === "number" ? new Date(ttl * 1000) : null,
  };
}

function soloDigitos(telefono: string): string {
  return telefono.replace(/\D/g, "");
}

/** Guarda el mensaje del asociado en su conversación con el gestor. */
async function guardar(mensaje: MensajeEntrante): Promise<string> {
  // El teléfono llega con el formato del proveedor; se compara por dígitos para
  // no depender de si trae "+" o espacios.
  const asociados = await prisma.asociado.findMany({
    where: { estado: "ACTIVO", telefonoWhatsapp: { not: null } },
    select: { id: true, telefonoWhatsapp: true },
  });

  const digitos = soloDigitos(mensaje.telefono);
  const candidatos = asociados
    .filter((a) => soloDigitos(a.telefonoWhatsapp!) === digitos)
    .map((a) => a.id);

  if (candidatos.length === 0) return "asociado no encontrado";

  // El webhook puede repetirse y la conversación no debe duplicar burbujas.
  if (mensaje.mensajeId) {
    const existente = await prisma.mensaje.findUnique({
      where: { truoraMessageId: mensaje.mensajeId },
      select: { id: true },
    });
    if (existente) return "duplicado";
  }

  // Varios asociados pueden compartir el teléfono (pasa con los datos de
  // prueba), así que el mensaje va a la conversación más reciente de ese
  // número, no al primer asociado que coincida.
  const conversacion = await prisma.conversacion.findFirst({
    where: { asociadoId: { in: candidatos } },
    select: { id: true, companiaId: true },
    orderBy: { ultimoMensajeAt: "desc" },
  });
  if (!conversacion) return "sin conversación abierta";

  const ahora = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.mensaje.create({
      data: {
        companiaId: conversacion.companiaId,
        conversacionId: conversacion.id,
        direccion: "ENTRADA",
        cuerpo: mensaje.cuerpo,
        estado: "ENTREGADO",
        truoraMessageId: mensaje.mensajeId,
      },
    });

    await tx.conversacion.update({
      where: { id: conversacion.id },
      data: {
        truoraChatId: mensaje.chatId ?? undefined,
        ventanaExpiraAt:
          mensaje.ventanaExpiraAt ??
          new Date(ahora.getTime() + VENTANA_HORAS * 60 * 60 * 1000),
        ultimoMensajeAt: ahora,
        noLeidos: { increment: 1 },
      },
    });
  });

  return "guardado";
}

export async function POST(request: NextRequest) {
  const crudo = await request.text();
  const payload = decodificarToken(crudo.trim());

  if (!payload) {
    console.warn("[whatsapp entrante] token inválido o firma que no coincide");
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const eventos = payload.events ?? [];
  const resultados: string[] = [];

  for (const evento of eventos) {
    const mensaje = comoMensaje(evento);

    if (!mensaje || !mensaje.cuerpo) {
      // El lote trae también acuses de entrega y eventos de sistema. Se listan
      // las rutas (sin valores) para reconocer formas que todavía no mapeamos.
      console.warn(
        `[whatsapp entrante] evento ignorado. Rutas: ${rutasDe(evento).join(", ")}`,
      );
      continue;
    }

    const resultado = await guardar(mensaje);
    console.log(
      `[whatsapp entrante] ${mensaje.telefono} -> ${resultado}`,
    );
    resultados.push(resultado);
  }

  return NextResponse.json({ ok: true, eventos: eventos.length, resultados });
}
