"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obtenerContextoUsuario } from "@/lib/contexto-usuario";
import { ipDeLaSolicitud, registrarAuditoria } from "@/lib/auditoria";
import { mapearDuplicado } from "@/lib/errores-prisma";
import { BASE_CRM } from "@/lib/navegacion";
import type { ResultadoAccion } from "@/lib/validaciones/usuario";
import {
  esquemaActualizarCompania,
  esquemaCrearCompania,
  esquemaOficina,
  esquemaReemplazarAdministrador,
} from "@/lib/validaciones/compania";

/**
 * Server actions de Gestión de Compañías (CRM.docx §3.2).
 *
 * A diferencia de Usuarios, acá NO hay filtro por compañía: el alcance del
 * Administrador General es global ("todas las compañías" en la matriz de
 * visibilidad, y RN-03 pide que vea tanto las activas como las inactivas). La
 * barrera es el rol, no el tenant. Conviene tenerlo presente para no copiar
 * este módulo a uno que sí deba filtrar.
 */

const RUTA = `${BASE_CRM}/companias`;

type Contexto = { usuarioId: string; ip: string | null };

const NO_AUTORIZADO: ResultadoAccion = {
  ok: false,
  mensaje: "No tienes permiso para realizar esta acción.",
};

async function exigirAdminGeneral(): Promise<Contexto | null> {
  const contexto = await obtenerContextoUsuario();
  if (!contexto) return null;
  if (contexto.rol.codigo !== "ADMIN_GENERAL") return null;

  return { usuarioId: contexto.usuario.id, ip: await ipDeLaSolicitud() };
}

function erroresDeZod(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = issue.path.join(".") || "general";
    errores[campo] ??= issue.message;
  }
  return errores;
}

function errorDeDuplicado(error: unknown): ResultadoAccion | null {
  return mapearDuplicado<ResultadoAccion>(error, [
    [
      "compania_nit_key",
      {
        ok: false,
        mensaje: "Ese NIT ya está registrado.",
        errores: { nit: "Ya existe una compañía con este NIT" },
      },
    ],
    [
      "oficina_compania_id_codigo_key",
      {
        ok: false,
        mensaje: "Hay un código de oficina repetido en la compañía.",
        errores: { codigo: "Ya existe una oficina con este código" },
      },
    ],
    [
      "numero_identificacion",
      {
        ok: false,
        mensaje: "Una de las identificaciones ya está registrada.",
        errores: {
          numeroIdentificacion: "Ya existe un usuario con esta identificación",
        },
      },
    ],
    [
      "email",
      {
        ok: false,
        mensaje: "Uno de los correos ya está registrado.",
        errores: { email: "Ya existe un usuario con este correo" },
      },
    ],
    ["", { ok: false, mensaje: "El registro duplica un valor único." }],
  ]);
}

// ------------------------------------------------------------------ crear

/**
 * Alta de compañía. RN-04 la exige transaccional junto con sus administradores:
 * o entra todo, o no entra nada.
 *
 * Las oficinas también van acá porque sin al menos una la compañía queda
 * inutilizable — su Administrador no podría crear Líderes ni Gestores.
 */
export async function crearCompania(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirAdminGeneral();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaCrearCompania.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  try {
    await prisma.$transaction(async (tx) => {
      const compania = await tx.compania.create({
        data: {
          nit: datos.nit,
          digitoVerificacion: datos.digitoVerificacion,
          razonSocial: datos.razonSocial,
          estado: datos.estado,
          horaCierreSesion: datos.horaCierreSesion,
          createdBy: ctx.usuarioId,
        },
      });

      await registrarAuditoria(tx, {
        tabla: "compania",
        registroId: compania.id,
        operacion: "INSERT",
        usuarioId: ctx.usuarioId,
        companiaId: compania.id,
        ip: ctx.ip,
        valoresNuevos: {
          nit: compania.nit,
          digitoVerificacion: compania.digitoVerificacion,
          razonSocial: compania.razonSocial,
          estado: compania.estado,
          horaCierreSesion: compania.horaCierreSesion,
        },
      });

      for (const oficina of datos.oficinas) {
        const creada = await tx.oficina.create({
          data: {
            companiaId: compania.id,
            codigo: oficina.codigo,
            nombre: oficina.nombre,
            createdBy: ctx.usuarioId,
          },
        });
        await registrarAuditoria(tx, {
          tabla: "oficina",
          registroId: creada.id,
          operacion: "INSERT",
          usuarioId: ctx.usuarioId,
          companiaId: compania.id,
          ip: ctx.ip,
          valoresNuevos: { codigo: creada.codigo, nombre: creada.nombre },
        });
      }

      // RN-10: exactamente 2 Administradores de Compañía activos al crearla.
      for (const admin of datos.administradores) {
        const creado = await tx.usuario.create({
          data: {
            companiaId: compania.id,
            email: admin.email,
            nombres: admin.nombres,
            apellidos: admin.apellidos,
            numeroIdentificacion: admin.numeroIdentificacion,
            telefonoWhatsapp: admin.telefonoWhatsapp,
            rolCodigo: "ADMIN_COMPANIA",
            createdBy: ctx.usuarioId,
          },
        });
        await registrarAuditoria(tx, {
          tabla: "usuario",
          registroId: creado.id,
          operacion: "INSERT",
          usuarioId: ctx.usuarioId,
          companiaId: compania.id,
          ip: ctx.ip,
          valoresNuevos: {
            email: creado.email,
            nombres: creado.nombres,
            apellidos: creado.apellidos,
            rolCodigo: creado.rolCodigo,
            estado: creado.estado,
          },
        });
      }
    });
  } catch (error) {
    const duplicado = errorDeDuplicado(error);
    if (duplicado) return duplicado;
    console.error("[crearCompania]", error);
    return { ok: false, mensaje: "No se pudo crear la compañía." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

// ------------------------------------------------------------- actualizar

export async function actualizarCompania(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirAdminGeneral();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaActualizarCompania.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  const actual = await prisma.compania.findUnique({
    where: { id: datos.id },
    select: {
      id: true,
      nit: true,
      digitoVerificacion: true,
      razonSocial: true,
      estado: true,
      horaCierreSesion: true,
    },
  });
  if (!actual) return NO_AUTORIZADO;

  try {
    await prisma.$transaction(async (tx) => {
      const actualizada = await tx.compania.update({
        where: { id: actual.id },
        data: {
          nit: datos.nit,
          digitoVerificacion: datos.digitoVerificacion,
          razonSocial: datos.razonSocial,
          estado: datos.estado,
          horaCierreSesion: datos.horaCierreSesion,
          updatedBy: ctx.usuarioId,
        },
      });

      await registrarAuditoria(tx, {
        tabla: "compania",
        registroId: actual.id,
        operacion: "UPDATE",
        usuarioId: ctx.usuarioId,
        companiaId: actual.id,
        ip: ctx.ip,
        valoresAnteriores: actual,
        valoresNuevos: {
          nit: actualizada.nit,
          digitoVerificacion: actualizada.digitoVerificacion,
          razonSocial: actualizada.razonSocial,
          estado: actualizada.estado,
          horaCierreSesion: actualizada.horaCierreSesion,
        },
      });
    });
  } catch (error) {
    const duplicado = errorDeDuplicado(error);
    if (duplicado) return duplicado;
    console.error("[actualizarCompania]", error);
    return { ok: false, mensaje: "No se pudo actualizar la compañía." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

// ---------------------------------------------------------- cambiar estado

/**
 * RN-01: la compañía no se elimina, lo máximo es pasarla a INACTIVA.
 *
 * No hace falta tocar a sus usuarios: el hook de sesión ya impide autenticarse
 * cuando la compañía no está activa.
 */
export async function cambiarEstadoCompania(
  companiaId: string,
): Promise<ResultadoAccion> {
  const ctx = await exigirAdminGeneral();
  if (!ctx) return NO_AUTORIZADO;

  const actual = await prisma.compania.findUnique({
    where: { id: companiaId },
    select: { id: true, estado: true },
  });
  if (!actual) return NO_AUTORIZADO;

  const nuevo = actual.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

  try {
    await prisma.$transaction(async (tx) => {
      await tx.compania.update({
        where: { id: actual.id },
        data: { estado: nuevo, updatedBy: ctx.usuarioId },
      });
      await registrarAuditoria(tx, {
        tabla: "compania",
        registroId: actual.id,
        operacion: "CAMBIO_ESTADO",
        usuarioId: ctx.usuarioId,
        companiaId: actual.id,
        ip: ctx.ip,
        valoresAnteriores: { estado: actual.estado },
        valoresNuevos: { estado: nuevo },
      });
    });
  } catch (error) {
    console.error("[cambiarEstadoCompania]", error);
    return { ok: false, mensaje: "No se pudo cambiar el estado." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

// ----------------------------------------------------------------- oficinas

/** Alta y edición de oficinas. Resuelve la pregunta abierta PA-02 del spec. */
export async function guardarOficina(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirAdminGeneral();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaOficina.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  const compania = await prisma.compania.findUnique({
    where: { id: datos.companiaId },
    select: { id: true },
  });
  if (!compania) return NO_AUTORIZADO;

  try {
    await prisma.$transaction(async (tx) => {
      if (datos.id) {
        const previa = await tx.oficina.findFirst({
          where: { id: datos.id, companiaId: compania.id },
          select: { id: true, codigo: true, nombre: true },
        });
        if (!previa) throw new Error("oficina fuera de la compañía");

        await tx.oficina.update({
          where: { id: previa.id },
          data: {
            codigo: datos.codigo,
            nombre: datos.nombre,
            updatedBy: ctx.usuarioId,
          },
        });
        await registrarAuditoria(tx, {
          tabla: "oficina",
          registroId: previa.id,
          operacion: "UPDATE",
          usuarioId: ctx.usuarioId,
          companiaId: compania.id,
          ip: ctx.ip,
          valoresAnteriores: previa,
          valoresNuevos: { codigo: datos.codigo, nombre: datos.nombre },
        });
        return;
      }

      const creada = await tx.oficina.create({
        data: {
          companiaId: compania.id,
          codigo: datos.codigo,
          nombre: datos.nombre,
          createdBy: ctx.usuarioId,
        },
      });
      await registrarAuditoria(tx, {
        tabla: "oficina",
        registroId: creada.id,
        operacion: "INSERT",
        usuarioId: ctx.usuarioId,
        companiaId: compania.id,
        ip: ctx.ip,
        valoresNuevos: { codigo: creada.codigo, nombre: creada.nombre },
      });
    });
  } catch (error) {
    const duplicado = errorDeDuplicado(error);
    if (duplicado) return duplicado;
    console.error("[guardarOficina]", error);
    return { ok: false, mensaje: "No se pudo guardar la oficina." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

/**
 * Las oficinas tampoco se borran. Y no se pueden inactivar mientras haya
 * usuarios activos asignados: el CHECK ck_usuario_gestor_con_oficina exige que
 * el Gestor tenga oficina, así que dejarlos apuntando a una inactiva sería una
 * inconsistencia silenciosa.
 */
export async function cambiarEstadoOficina(
  oficinaId: string,
): Promise<ResultadoAccion> {
  const ctx = await exigirAdminGeneral();
  if (!ctx) return NO_AUTORIZADO;

  const actual = await prisma.oficina.findUnique({
    where: { id: oficinaId },
    select: { id: true, estado: true, nombre: true, companiaId: true },
  });
  if (!actual) return NO_AUTORIZADO;

  const nuevo = actual.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

  if (nuevo === "INACTIVO") {
    const enUso = await prisma.usuario.count({
      where: {
        estado: "ACTIVO",
        OR: [
          { oficinaId: actual.id },
          { usuarioOficinas: { some: { oficinaId: actual.id, vigente: true } } },
        ],
      },
    });
    if (enUso > 0) {
      return {
        ok: false,
        mensaje: `No se puede inactivar ${actual.nombre}: tiene ${enUso} usuario(s) activo(s) asignado(s).`,
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.oficina.update({
        where: { id: actual.id },
        data: { estado: nuevo, updatedBy: ctx.usuarioId },
      });
      await registrarAuditoria(tx, {
        tabla: "oficina",
        registroId: actual.id,
        operacion: "CAMBIO_ESTADO",
        usuarioId: ctx.usuarioId,
        companiaId: actual.companiaId,
        ip: ctx.ip,
        valoresAnteriores: { estado: actual.estado },
        valoresNuevos: { estado: nuevo },
      });
    });
  } catch (error) {
    console.error("[cambiarEstadoOficina]", error);
    return { ok: false, mensaje: "No se pudo cambiar el estado de la oficina." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

// ----------------------------------------------------- reemplazar admin

/**
 * Reemplaza a un Administrador de Compañía.
 *
 * No se edita su correo porque RN-12 lo declara inmutable: se inactiva el
 * actual y se crea el nuevo en la misma transacción, así la compañía nunca
 * queda por debajo del mínimo de administradores activos que pide RN-10.
 */
export async function reemplazarAdministrador(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirAdminGeneral();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaReemplazarAdministrador.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  const anterior = await prisma.usuario.findFirst({
    where: {
      id: datos.administradorId,
      companiaId: datos.companiaId,
      rolCodigo: "ADMIN_COMPANIA",
    },
    select: { id: true, email: true, estado: true },
  });
  if (!anterior) return NO_AUTORIZADO;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: anterior.id },
        data: { estado: "INACTIVO", updatedBy: ctx.usuarioId },
      });

      const creado = await tx.usuario.create({
        data: {
          companiaId: datos.companiaId,
          email: datos.nuevo.email,
          nombres: datos.nuevo.nombres,
          apellidos: datos.nuevo.apellidos,
          numeroIdentificacion: datos.nuevo.numeroIdentificacion,
          telefonoWhatsapp: datos.nuevo.telefonoWhatsapp,
          rolCodigo: "ADMIN_COMPANIA",
          createdBy: ctx.usuarioId,
        },
      });

      // RN-10: nunca menos de un administrador activo. El reemplazo mantiene la
      // cuenta, pero se comprueba de todos modos dentro de la transacción.
      const activos = await tx.usuario.count({
        where: {
          companiaId: datos.companiaId,
          rolCodigo: "ADMIN_COMPANIA",
          estado: "ACTIVO",
        },
      });
      if (activos < 1) {
        throw new Error("RN-10: la compañía quedaría sin administradores");
      }

      await registrarAuditoria(tx, {
        tabla: "usuario",
        registroId: anterior.id,
        operacion: "CAMBIO_ESTADO",
        usuarioId: ctx.usuarioId,
        companiaId: datos.companiaId,
        ip: ctx.ip,
        valoresAnteriores: { estado: anterior.estado },
        valoresNuevos: { estado: "INACTIVO", reemplazadoPor: creado.email },
      });

      await registrarAuditoria(tx, {
        tabla: "usuario",
        registroId: creado.id,
        operacion: "INSERT",
        usuarioId: ctx.usuarioId,
        companiaId: datos.companiaId,
        ip: ctx.ip,
        valoresNuevos: {
          email: creado.email,
          nombres: creado.nombres,
          apellidos: creado.apellidos,
          rolCodigo: creado.rolCodigo,
          reemplazaA: anterior.email,
        },
      });
    });
  } catch (error) {
    const duplicado = errorDeDuplicado(error);
    if (duplicado) return duplicado;
    console.error("[reemplazarAdministrador]", error);
    return { ok: false, mensaje: "No se pudo reemplazar el administrador." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}
