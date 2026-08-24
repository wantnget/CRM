"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  NO_AUTORIZADO,
  erroresDeZod,
  exigirGestor,
} from "@/lib/acciones/gestor";
import { BASE_CRM } from "@/lib/navegacion";
import { enviarCorreo } from "@/lib/twilio";
import type { ResultadoAccion } from "@/lib/validaciones/usuario";
import {
  esquemaEliminarCorreo,
  esquemaEnviarCorreo,
} from "@/lib/validaciones/correo";

const RUTA = `${BASE_CRM}/comunicacion/email`;

export async function enviarCorreoOportunidad(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirGestor();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaEnviarCorreo.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  const oportunidad = await prisma.oportunidad.findFirst({
    where: {
      id: datos.oportunidadId,
      companiaId: ctx.companiaId,
      gestorId: ctx.gestorId,
    },
    select: {
      id: true,
      etapa: true,
      asociadoId: true,
      asociado: { select: { email: true } },
    },
  });
  if (!oportunidad) {
    return {
      ok: false,
      mensaje: "No encontramos esa oportunidad en tu bandeja.",
    };
  }
  if (!oportunidad.asociado.email) {
    return { ok: false, mensaje: "Este asociado no tiene correo registrado." };
  }

  const canal = await prisma.usuarioCanal.findFirst({
    where: { usuarioId: ctx.gestorId, canalCodigo: "CORREO_SALIDA", habilitado: true },
    select: { canal: { select: { codigo: true, direccion: true } } },
  });
  if (!canal) {
    return {
      ok: false,
      mensaje: "El canal de correo saliente no está habilitado para tu usuario.",
    };
  }

  const ahora = new Date();
  let mensajeExternoId: string | null = null;

  try {
    mensajeExternoId = (
      await enviarCorreo({
        destinatario: oportunidad.asociado.email,
        asunto: datos.asunto,
        cuerpo: datos.cuerpo,
      })
    ).messageId ?? null;
  } catch (error) {
    console.error("[enviarCorreoOportunidad] envío correo", error);
    return { ok: false, mensaje: "No se pudo enviar el correo." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const gestion = await tx.gestion.create({
        data: {
          companiaId: ctx.companiaId,
          oportunidadId: oportunidad.id,
          asociadoId: oportunidad.asociadoId,
          gestorId: ctx.gestorId,
          fechaHora: ahora,
          etapa: oportunidad.etapa,
          canalCodigo: canal.canal.codigo,
          direccion: canal.canal.direccion,
          asunto: datos.asunto,
          observacion: datos.cuerpo,
          mensajeExternoId,
          createdBy: ctx.gestorId,
        },
      });

      await tx.oportunidad.update({
        where: { id: oportunidad.id },
        data: { fechaUltimaGestion: ahora, updatedBy: ctx.gestorId },
      });

      await registrarAuditoria(tx, {
        tabla: "gestion",
        registroId: gestion.id,
        operacion: "INSERT",
        usuarioId: ctx.gestorId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresNuevos: {
          oportunidadId: gestion.oportunidadId,
          etapa: gestion.etapa,
          canalCodigo: gestion.canalCodigo,
          direccion: gestion.direccion,
        },
      });
    });
  } catch (error) {
    console.error("[enviarCorreoOportunidad] registro gestión", error);
    return {
      ok: false,
      mensaje: "El correo se envió, pero no se pudo dejar registrado en el CRM.",
    };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

/**
 * Marca el correo como eliminado sin borrar la fila: RN-43 deja la gestión
 * inmutable, así que la bitácora conserva el mensaje y la bandeja solo deja de
 * mostrarlo fuera de la papelera.
 */
export async function eliminarCorreo(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirGestor();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaEliminarCorreo.safeParse(entrada);
  if (!parseo.success) {
    return { ok: false, mensaje: "Selección inválida." };
  }

  const gestion = await prisma.gestion.findFirst({
    where: {
      id: parseo.data.gestionId,
      companiaId: ctx.companiaId,
      gestorId: ctx.gestorId,
      canal: { medio: "EMAIL" },
    },
    select: { id: true, eliminadoAt: true },
  });
  if (!gestion) {
    return { ok: false, mensaje: "No encontramos ese correo en tu bandeja." };
  }
  if (gestion.eliminadoAt) return { ok: true };

  const ahora = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.gestion.update({
        where: { id: gestion.id },
        data: { eliminadoAt: ahora, eliminadoBy: ctx.gestorId },
      });

      await registrarAuditoria(tx, {
        tabla: "gestion",
        registroId: gestion.id,
        operacion: "CAMBIO_ESTADO",
        usuarioId: ctx.gestorId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresAnteriores: { eliminadoAt: null },
        valoresNuevos: { eliminadoAt: ahora },
      });
    });
  } catch (error) {
    console.error("[eliminarCorreo]", error);
    return { ok: false, mensaje: "No se pudo eliminar el correo." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}
