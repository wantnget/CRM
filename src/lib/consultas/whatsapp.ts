import { prisma } from "@/lib/prisma";
import { inicialesDe } from "@/lib/formato";
import type { DireccionComunicacion, EstadoMensaje } from "@/generated/prisma/enums";

export type MensajeChat = {
  id: string;
  direccion: DireccionComunicacion;
  cuerpo: string;
  estado: EstadoMensaje;
  fechaHora: Date;
};

export type Chat = {
  id: string;
  asociadoId: string;
  nombre: string;
  iniciales: string;
  telefono: string;
  ultimoMensaje: string;
  ultimoMensajeAt: Date | null;
  noLeidos: number;
  /**
   * Ventana de 24 h abierta. Se resuelve en el servidor: comparar la fecha en
   * el render haría al componente impuro y el estado dependería de cuándo
   * React decida re-renderizar.
   */
  ventanaAbierta: boolean;
  mensajes: MensajeChat[];
};

/** Conversaciones del gestor, la más reciente primero. */
export async function obtenerChats({
  companiaId,
  gestorId,
}: {
  companiaId: string;
  gestorId: string;
}): Promise<Chat[]> {
  const conversaciones = await prisma.conversacion.findMany({
    where: { companiaId, gestorId },
    select: {
      id: true,
      asociadoId: true,
      noLeidos: true,
      ultimoMensajeAt: true,
      ventanaExpiraAt: true,
      asociado: { select: { nombreCompleto: true, telefonoWhatsapp: true } },
      mensajes: {
        select: {
          id: true,
          direccion: true,
          cuerpo: true,
          estado: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ ultimoMensajeAt: "desc" }, { createdAt: "desc" }],
  });

  const ahora = Date.now();

  return conversaciones.map((conversacion) => {
    const mensajes = conversacion.mensajes.map((mensaje) => ({
      id: mensaje.id,
      direccion: mensaje.direccion,
      cuerpo: mensaje.cuerpo,
      estado: mensaje.estado,
      fechaHora: mensaje.createdAt,
    }));

    return {
      id: conversacion.id,
      asociadoId: conversacion.asociadoId,
      nombre: conversacion.asociado.nombreCompleto,
      iniciales: inicialesDe(conversacion.asociado.nombreCompleto),
      telefono: conversacion.asociado.telefonoWhatsapp ?? "",
      ultimoMensaje: mensajes.at(-1)?.cuerpo ?? "",
      ultimoMensajeAt: conversacion.ultimoMensajeAt,
      noLeidos: conversacion.noLeidos,
      ventanaAbierta:
        conversacion.ventanaExpiraAt !== null &&
        conversacion.ventanaExpiraAt.getTime() > ahora,
      mensajes,
    };
  });
}

export type ContactoWhatsapp = {
  asociadoId: string;
  nombre: string;
  telefono: string;
  /** Ya tiene conversación abierta: no hay que volver a mandar plantilla. */
  conConversacion: boolean;
};

/**
 * Asociados de la cartera del gestor con WhatsApp registrado. Alimenta el
 * inicio de una conversación nueva, así la regla de alcance (RN-32) se cumple
 * por construcción.
 */
export async function obtenerContactosWhatsapp({
  companiaId,
  gestorId,
}: {
  companiaId: string;
  gestorId: string;
}): Promise<ContactoWhatsapp[]> {
  const asignaciones = await prisma.asignacionAsociado.findMany({
    where: {
      companiaId,
      gestorId,
      vigente: true,
      asociado: { estado: "ACTIVO", telefonoWhatsapp: { not: null } },
    },
    select: {
      asociado: {
        select: {
          id: true,
          nombreCompleto: true,
          telefonoWhatsapp: true,
          conversaciones: {
            where: { gestorId },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { asociado: { nombreCompleto: "asc" } },
  });

  return asignaciones.map(({ asociado }) => ({
    asociadoId: asociado.id,
    nombre: asociado.nombreCompleto,
    telefono: asociado.telefonoWhatsapp!,
    conConversacion: asociado.conversaciones.length > 0,
  }));
}
