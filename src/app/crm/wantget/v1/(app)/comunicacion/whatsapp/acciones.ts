"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  NO_AUTORIZADO,
  erroresDeZod,
  exigirGestor,
  type ContextoGestor,
} from "@/lib/acciones/gestor";
import { BASE_CRM } from "@/lib/navegacion";
import {
  abrirConversacionWhatsApp,
  buscarChatWhatsapp,
  enviarMensajeWhatsapp,
} from "@/lib/truora";
import type { ResultadoAccion } from "@/lib/validaciones/usuario";
import {
  esquemaAbrirConversacion,
  esquemaEliminarConversacion,
  esquemaEnviarMensaje,
} from "@/lib/validaciones/whatsapp";

const RUTA = `${BASE_CRM}/comunicacion/whatsapp`;

const TEXTO_PLANTILLA =
  "Mensaje de apertura enviado para habilitar la conversación.";

/**
 * Abre la conversación con un asociado de la cartera del gestor.
 *
 * WhatsApp no permite escribir primero texto libre, así que el arranque es
 * siempre la plantilla aprobada: habilita la ventana de 24 h y recién cuando el
 * asociado responde se puede conversar de verdad.
 */
export async function abrirConversacion(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirGestor();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaAbrirConversacion.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }

  // RN-32: solo asociados asignados y vigentes.
  const asignacion = await prisma.asignacionAsociado.findFirst({
    where: {
      companiaId: ctx.companiaId,
      gestorId: ctx.gestorId,
      asociadoId: parseo.data.asociadoId,
      vigente: true,
    },
    select: {
      asociado: { select: { id: true, telefonoWhatsapp: true } },
    },
  });
  if (!asignacion) {
    return { ok: false, mensaje: "Ese asociado no está asignado a tu cartera." };
  }

  const { id: asociadoId, telefonoWhatsapp } = asignacion.asociado;
  if (!telefonoWhatsapp) {
    return { ok: false, mensaje: "Este asociado no tiene WhatsApp registrado." };
  }

  try {
    await abrirConversacionWhatsApp(telefonoWhatsapp);
  } catch (error) {
    console.error("[abrirConversacion] plantilla Truora", error);
    return { ok: false, mensaje: "No se pudo enviar el mensaje de apertura." };
  }

  const ahora = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const conversacion = await tx.conversacion.upsert({
        where: { asociadoId_gestorId: { asociadoId, gestorId: ctx.gestorId } },
        create: {
          companiaId: ctx.companiaId,
          asociadoId,
          gestorId: ctx.gestorId,
          ultimoMensajeAt: ahora,
          createdBy: ctx.gestorId,
        },
        update: { ultimoMensajeAt: ahora },
        select: { id: true },
      });

      await tx.mensaje.create({
        data: {
          companiaId: ctx.companiaId,
          conversacionId: conversacion.id,
          direccion: "SALIDA",
          cuerpo: TEXTO_PLANTILLA,
          estado: "ENVIADO",
          gestorId: ctx.gestorId,
        },
      });
    });
  } catch (error) {
    console.error("[abrirConversacion] registro", error);
    return {
      ok: false,
      mensaje: "Se envió la plantilla, pero no se pudo registrar la conversación.",
    };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

type ChatResuelto = {
  conversacionId: string;
  chatId: string;
  ventanaExpiraAt: Date | null;
};

/**
 * Ubica la conversación del gestor y resuelve con qué chat de Truora hablar.
 *
 * El `chat_id` aparece cuando el asociado responde: si todavía no lo tenemos
 * guardado se busca una vez y queda persistido en el envío. Es el paso que
 * comparten el texto y el audio, junto con la validación de la ventana.
 */
async function resolverChat(
  ctx: ContextoGestor,
  conversacionId: string,
): Promise<{ error: ResultadoAccion } | { chat: ChatResuelto }> {
  const conversacion = await prisma.conversacion.findFirst({
    where: { id: conversacionId, companiaId: ctx.companiaId, gestorId: ctx.gestorId },
    select: {
      id: true,
      truoraChatId: true,
      ventanaExpiraAt: true,
      asociado: { select: { telefonoWhatsapp: true } },
    },
  });
  if (!conversacion) {
    return { error: { ok: false, mensaje: "No encontramos esa conversación." } };
  }

  const telefono = conversacion.asociado.telefonoWhatsapp;
  if (!telefono) {
    return {
      error: { ok: false, mensaje: "Este asociado no tiene WhatsApp registrado." },
    };
  }

  let chatId = conversacion.truoraChatId;
  let ventanaExpiraAt = conversacion.ventanaExpiraAt;

  if (!chatId) {
    try {
      const chat = await buscarChatWhatsapp(telefono);
      if (chat) {
        chatId = chat.chatId;
        ventanaExpiraAt = chat.ventanaExpiraAt;
      }
    } catch (error) {
      console.error("[whatsapp] búsqueda de chat", error);
      return {
        error: {
          ok: false,
          mensaje: "No se pudo consultar la conversación en Truora.",
        },
      };
    }
  }

  if (!chatId) {
    return {
      error: {
        ok: false,
        mensaje:
          "El asociado todavía no ha respondido. Hasta que conteste no se puede escribir.",
      },
    };
  }

  if (ventanaExpiraAt && ventanaExpiraAt.getTime() <= Date.now()) {
    return {
      error: {
        ok: false,
        mensaje:
          "La ventana de 24 horas se cerró. Vuelve a abrir la conversación con la plantilla.",
      },
    };
  }

  return { chat: { conversacionId: conversacion.id, chatId, ventanaExpiraAt } };
}

/** Deja el mensaje enviado en la conversación y actualiza su estado. */
async function registrarSalida({
  ctx,
  chat,
  cuerpo,
}: {
  ctx: ContextoGestor;
  chat: ChatResuelto;
  cuerpo: string;
}) {
  const ahora = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.mensaje.create({
      data: {
        companiaId: ctx.companiaId,
        conversacionId: chat.conversacionId,
        direccion: "SALIDA",
        cuerpo,
        estado: "ENVIADO",
        gestorId: ctx.gestorId,
      },
    });

    await tx.conversacion.update({
      where: { id: chat.conversacionId },
      data: {
        truoraChatId: chat.chatId,
        ventanaExpiraAt: chat.ventanaExpiraAt,
        ultimoMensajeAt: ahora,
      },
    });
  });
}

/**
 * Envía texto libre. Solo es posible dentro de la ventana de 24 h que abre la
 * respuesta del asociado; fuera de ella hay que volver a mandar la plantilla.
 */
export async function enviarMensaje(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirGestor();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaEnviarMensaje.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  const resuelto = await resolverChat(ctx, datos.conversacionId);
  if ("error" in resuelto) return resuelto.error;

  try {
    await enviarMensajeWhatsapp({
      chatId: resuelto.chat.chatId,
      cuerpo: datos.cuerpo,
      usuario: ctx.email,
    });
  } catch (error) {
    console.error("[enviarMensaje] envío Truora", error);
    return { ok: false, mensaje: "No se pudo enviar el mensaje." };
  }

  try {
    await registrarSalida({
      ctx,
      chat: resuelto.chat,
      cuerpo: datos.cuerpo,
    });
  } catch (error) {
    console.error("[enviarMensaje] registro", error);
    return {
      ok: false,
      mensaje: "El mensaje se envió, pero no se pudo guardar en el CRM.",
    };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

/**
 * Elimina la conversación del CRM, con sus mensajes (la relación borra en
 * cascada). No toca el chat del lado de Truora: allá la conversación sigue
 * existiendo, así que volver a escribirle al asociado la retoma.
 */
export async function eliminarConversacion(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirGestor();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaEliminarConversacion.safeParse(entrada);
  if (!parseo.success) {
    return { ok: false, mensaje: "Selección inválida." };
  }

  const borradas = await prisma.conversacion.deleteMany({
    where: {
      id: parseo.data.conversacionId,
      companiaId: ctx.companiaId,
      gestorId: ctx.gestorId,
    },
  });

  if (borradas.count === 0) {
    return { ok: false, mensaje: "No encontramos esa conversación." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

/** Marca como leídos los entrantes al abrir la conversación. */
export async function marcarLeida(conversacionId: string) {
  const ctx = await exigirGestor();
  if (!ctx) return;

  await prisma.conversacion.updateMany({
    where: { id: conversacionId, companiaId: ctx.companiaId, gestorId: ctx.gestorId },
    data: { noLeidos: 0 },
  });

  revalidatePath(RUTA);
}
