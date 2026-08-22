"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  NO_AUTORIZADO,
  erroresDeZod,
  exigirGestor,
} from "@/lib/acciones/gestor";
import { formatoDuracion } from "@/lib/formato";
import { BASE_CRM } from "@/lib/navegacion";
import type { ResultadoAccion } from "@/lib/validaciones/usuario";
import { esquemaRegistrarLlamada } from "@/lib/validaciones/llamada";

const RUTA = `${BASE_CRM}/comunicacion/llamadas`;

/**
 * Deja la llamada en la bitácora del asociado. La llamada en sí la origina el
 * softphone en el navegador (Twilio Voice); acá solo se registra su resultado,
 * con la duración al frente para que el historial se lea sin abrir la nota.
 */
export async function registrarLlamada(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirGestor();
  if (!ctx) return NO_AUTORIZADO;

  const { gestorId, companiaId } = ctx;

  const parseo = esquemaRegistrarLlamada.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  const oportunidad = await prisma.oportunidad.findFirst({
    where: { id: datos.oportunidadId, companiaId, gestorId },
    select: { id: true, etapa: true, estado: true, asociadoId: true },
  });
  if (!oportunidad) {
    return { ok: false, mensaje: "No encontramos esa prospección en tu bandeja." };
  }
  if (oportunidad.etapa === "CIERRE" || oportunidad.estado === "CERRADO") {
    return {
      ok: false,
      mensaje: "La prospección está cerrada y no admite nuevas gestiones.",
    };
  }

  const canal = await prisma.usuarioCanal.findFirst({
    where: { usuarioId: gestorId, canalCodigo: "LLAMADA", habilitado: true },
    select: { canal: { select: { codigo: true, direccion: true } } },
  });
  if (!canal) {
    return {
      ok: false,
      mensaje: "El canal de llamadas no está habilitado para tu usuario.",
    };
  }

  const ahora = new Date();
  const { ip } = ctx;
  const observacion = `[Llamada ${formatoDuracion(datos.duracionSegundos)}] ${datos.observacion}`;

  try {
    await prisma.$transaction(async (tx) => {
      const gestion = await tx.gestion.create({
        data: {
          companiaId,
          oportunidadId: oportunidad.id,
          asociadoId: oportunidad.asociadoId,
          gestorId,
          fechaHora: ahora,
          etapa: oportunidad.etapa,
          canalCodigo: canal.canal.codigo,
          direccion: canal.canal.direccion,
          observacion,
          createdBy: gestorId,
        },
      });

      await tx.oportunidad.update({
        where: { id: oportunidad.id },
        data: { fechaUltimaGestion: ahora, updatedBy: gestorId },
      });

      await registrarAuditoria(tx, {
        tabla: "gestion",
        registroId: gestion.id,
        operacion: "INSERT",
        usuarioId: gestorId,
        companiaId,
        ip,
        valoresNuevos: {
          oportunidadId: gestion.oportunidadId,
          etapa: gestion.etapa,
          canalCodigo: gestion.canalCodigo,
          direccion: gestion.direccion,
        },
      });
    });
  } catch (error) {
    console.error("[registrarLlamada]", error);
    return { ok: false, mensaje: "No se pudo registrar la llamada." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}
