"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obtenerContextoUsuario } from "@/lib/contexto-usuario";
import { ipDeLaSolicitud, registrarAuditoria } from "@/lib/auditoria";
import { mapearDuplicado } from "@/lib/errores-prisma";
import { BASE_CRM } from "@/lib/navegacion";
import type { ResultadoAccion } from "@/lib/validaciones/usuario";
import { esquemaNuevaProspeccion } from "@/lib/validaciones/prospeccion";

/**
 * Server actions de Prospección (CRM.docx §7.3).
 *
 * El alcance es el del propio Gestor: la action revalida el rol y filtra por
 * `gestorId`, así que ni siquiera puede tocar una oportunidad de otro gestor de
 * la misma compañía.
 */

const RUTA = `${BASE_CRM}/prospeccion`;

type Contexto = {
  gestorId: string;
  companiaId: string;
  oficinaId: string | null;
  ip: string | null;
};

const NO_AUTORIZADO: ResultadoAccion = {
  ok: false,
  mensaje: "No tienes permiso para realizar esta acción.",
};

async function exigirGestor(): Promise<Contexto | null> {
  const contexto = await obtenerContextoUsuario();
  if (!contexto) return null;
  if (contexto.rol.codigo !== "GESTOR") return null;
  if (!contexto.compania) return null;

  return {
    gestorId: contexto.usuario.id,
    companiaId: contexto.compania.id,
    oficinaId: contexto.oficina?.id ?? null,
    ip: await ipDeLaSolicitud(),
  };
}

function erroresDeZod(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = issue.path.join(".") || "general";
    errores[campo] ??= issue.message;
  }
  return errores;
}

/**
 * Fecha de hoy en Bogotá. Colombia es UTC-5 y no aplica horario de verano, así
 * que el periodo se calcula con ese corrimiento y no con el del servidor.
 */
function periodoActual(): string {
  const local = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const mes = String(local.getUTCMonth() + 1).padStart(2, "0");
  return `${local.getUTCFullYear()}-${mes}`;
}

// ------------------------------------------------------------------ crear

/**
 * Abre una prospección: crea la oportunidad en etapa CONTACTO y su primera
 * gestión con el canal del primer contacto.
 *
 * Las dos van juntas a propósito. RN-46 exige al menos una gestión en etapa
 * CONTACTO antes de poder avanzar a OFERTA, así que la oportunidad nace ya en
 * condiciones de avanzar; y el canal que elige el formulario queda registrado
 * donde corresponde, que es la bitácora.
 */
export async function crearProspeccion(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirGestor();
  if (!ctx) return NO_AUTORIZADO;

  if (!ctx.oficinaId) {
    // ck_usuario_gestor_con_oficina lo impide, pero oportunidad.oficina_id es
    // NOT NULL y conviene un mensaje antes que un error de base.
    return {
      ok: false,
      mensaje: "Tu usuario no tiene oficina asignada. Avisa al administrador.",
    };
  }

  const parseo = esquemaNuevaProspeccion.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  // RN-32: el asociado tiene que estar asignado a este gestor y vigente.
  const asignacion = await prisma.asignacionAsociado.findFirst({
    where: {
      companiaId: ctx.companiaId,
      gestorId: ctx.gestorId,
      asociadoId: datos.asociadoId,
      vigente: true,
    },
    select: { asociadoId: true },
  });
  if (!asignacion) {
    return {
      ok: false,
      mensaje: "Ese asociado no está asignado a tu cartera.",
      errores: { asociadoId: "Selecciona un asociado de tu cartera" },
    };
  }

  const producto = await prisma.producto.findFirst({
    where: { codigo: datos.productoCodigo, activo: true },
    select: { codigo: true },
  });
  if (!producto) {
    return {
      ok: false,
      mensaje: "El producto seleccionado no está disponible.",
      errores: { productoCodigo: "Selecciona un producto activo" },
    };
  }

  // RN-17 / RN-18 / RN-44: el canal tiene que estar habilitado para el gestor.
  // Se revalida acá y no se confía en el formulario.
  const canal = await prisma.usuarioCanal.findFirst({
    where: {
      usuarioId: ctx.gestorId,
      canalCodigo: datos.canalCodigo,
      habilitado: true,
    },
    select: { canal: { select: { codigo: true, direccion: true } } },
  });
  if (!canal) {
    return {
      ok: false,
      mensaje: "Ese canal no está habilitado para tu usuario.",
      errores: { canalCodigo: "Selecciona un canal habilitado" },
    };
  }

  // RN-40: una sola oportunidad abierta por pareja asociado + producto. La base
  // lo garantiza con un índice único parcial; esto es para dar un mensaje claro
  // en vez de un error de restricción.
  const abierta = await prisma.oportunidad.findFirst({
    where: {
      asociadoId: datos.asociadoId,
      productoCodigo: datos.productoCodigo,
      estado: "PROSPECCION",
    },
    select: { id: true },
  });
  if (abierta) {
    return {
      ok: false,
      mensaje:
        "Ese asociado ya tiene una prospección abierta para este producto.",
      errores: { productoCodigo: "Ya hay una oportunidad abierta" },
    };
  }

  const ahora = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      // El líder vigente se congela en la oportunidad para que una futura
      // reasignación no altere los resultados históricos.
      const asignacionLider = await tx.asignacionGestorLider.findFirst({
        where: { gestorId: ctx.gestorId, vigenteHasta: null },
        select: { liderId: true },
      });
      if (!asignacionLider) {
        throw new Error("SIN_LIDER");
      }

      const oportunidad = await tx.oportunidad.create({
        data: {
          companiaId: ctx.companiaId,
          asociadoId: datos.asociadoId,
          productoCodigo: datos.productoCodigo,
          gestorId: ctx.gestorId,
          liderId: asignacionLider.liderId,
          // La oficina es la del gestor: la atribución es sobre su resultado.
          oficinaId: ctx.oficinaId!,
          estado: "PROSPECCION",
          // RN-36: la prospección arranca en CONTACTO, no se saltan etapas.
          etapa: "CONTACTO",
          fechaApertura: ahora,
          fechaUltimaGestion: ahora,
          // RN-42: mientras está abierta, el periodo sale de la apertura.
          periodo: periodoActual(),
          createdBy: ctx.gestorId,
        },
      });

      // RN-46: la primera gestión, en la misma etapa.
      const gestion = await tx.gestion.create({
        data: {
          companiaId: ctx.companiaId,
          oportunidadId: oportunidad.id,
          // Denormalizado para poder traer la historia del asociado sin
          // recorrer todas sus oportunidades.
          asociadoId: datos.asociadoId,
          gestorId: ctx.gestorId,
          fechaHora: ahora,
          etapa: "CONTACTO",
          canalCodigo: canal.canal.codigo,
          // Derivable del canal, se persiste para consultas.
          direccion: canal.canal.direccion,
          observacion: datos.observacion || null,
          createdBy: ctx.gestorId,
        },
      });

      await registrarAuditoria(tx, {
        tabla: "oportunidad",
        registroId: oportunidad.id,
        operacion: "INSERT",
        usuarioId: ctx.gestorId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresNuevos: {
          asociadoId: oportunidad.asociadoId,
          productoCodigo: oportunidad.productoCodigo,
          estado: oportunidad.estado,
          etapa: oportunidad.etapa,
          periodo: oportunidad.periodo,
          liderId: oportunidad.liderId,
          oficinaId: oportunidad.oficinaId,
        },
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
    if (error instanceof Error && error.message === "SIN_LIDER") {
      return {
        ok: false,
        mensaje:
          "Tu usuario no tiene un líder asignado. Avisa al administrador de la compañía.",
      };
    }

    const duplicado = mapearDuplicado<ResultadoAccion>(error, [
      [
        "ux_oportunidad_abierta_asociado_producto",
        {
          ok: false,
          mensaje:
            "Ese asociado ya tiene una prospección abierta para este producto.",
          errores: { productoCodigo: "Ya hay una oportunidad abierta" },
        },
      ],
      ["", { ok: false, mensaje: "El registro duplica un valor único." }],
    ]);
    if (duplicado) return duplicado;

    console.error("[crearProspeccion]", error);
    return { ok: false, mensaje: "No se pudo abrir la prospección." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}
