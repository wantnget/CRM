"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerContextoUsuario } from "@/lib/contexto-usuario";
import { ipDeLaSolicitud, registrarAuditoria } from "@/lib/auditoria";
import { BASE_CRM } from "@/lib/navegacion";
import {
  esquemaActualizarUsuario,
  esquemaCrearUsuario,
  ROLES_ASIGNABLES,
  type ResultadoAccion,
} from "@/lib/validaciones/usuario";

/**
 * Server actions de la pantalla Usuarios (CRM.docx §4.2).
 *
 * Cada action revalida la autorización por su cuenta. No alcanza con la de la
 * página: una server action es una superficie invocable desde el cliente, igual
 * que un endpoint, y el spec pide que el control de alcance viva en la capa de
 * API y no solo en la UI.
 */

const RUTA = `${BASE_CRM}/usuarios`;

const CANALES = [
  "WA_SALIDA",
  "WA_ENTRADA",
  "CORREO_SALIDA",
  "CORREO_ENTRADA",
] as const;

type Contexto = {
  usuarioId: string;
  companiaId: string;
  ip: string | null;
};

const NO_AUTORIZADO: ResultadoAccion = {
  ok: false,
  mensaje: "No tienes permiso para realizar esta acción.",
};

const FUERA_DE_ALCANCE: ResultadoAccion = {
  ok: false,
  mensaje:
    "Este usuario lo administra el Administrador General, no se puede modificar aquí.",
};

/**
 * Exige una Administradora de Compañía autenticada y devuelve su contexto.
 * Mientras no exista la RLS del spec, el `companiaId` que sale de acá es la
 * única barrera de aislamiento multi-tenant de las mutaciones.
 */
async function exigirAdminCompania(): Promise<Contexto | null> {
  const contexto = await obtenerContextoUsuario();
  if (!contexto) return null;
  if (contexto.rol.codigo !== "ADMIN_COMPANIA") return null;
  if (!contexto.compania) return null;

  return {
    usuarioId: contexto.usuario.id,
    companiaId: contexto.compania.id,
    ip: await ipDeLaSolicitud(),
  };
}

/**
 * RN-07 y RN-08: la Administradora de Compañía solo maneja DIRECTOR, LIDER y
 * GESTOR. Las cuentas ADMIN_COMPANIA las crea el Administrador General.
 */
function esAdministrableAqui(rolCodigo: string): boolean {
  return (ROLES_ASIGNABLES as readonly string[]).includes(rolCodigo);
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
 * Nombre de la restricción única que se violó.
 *
 * Con driver adapter, Prisma 7 no pobla `meta.target`: deja el error original
 * de Postgres en `meta.driverAdapterError.cause.originalMessage`, cuyo texto
 * está localizado pero incluye el nombre de la restricción. Se buscan las dos
 * fuentes para no depender de una sola.
 */
function restriccionViolada(
  error: Prisma.PrismaClientKnownRequestError,
): string {
  const meta = error.meta as
    | {
        target?: unknown;
        driverAdapterError?: { cause?: { originalMessage?: unknown } };
      }
    | undefined;

  return [
    Array.isArray(meta?.target) ? meta.target.join(",") : String(meta?.target ?? ""),
    String(meta?.driverAdapterError?.cause?.originalMessage ?? ""),
    error.message,
  ].join(" | ");
}

/** Traduce la violación de índice único a un mensaje por campo. */
function errorDeDuplicado(error: unknown): ResultadoAccion | null {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return null;
  }

  const objetivo = restriccionViolada(error);

  // usuario_compania_id_numero_identificacion_key se evalúa primero: el otro
  // nombre, usuario_email_key, no contiene "numero_identificacion".
  if (objetivo.includes("numero_identificacion")) {
    return {
      ok: false,
      mensaje: "Esa identificación ya está registrada en la compañía.",
      errores: {
        numeroIdentificacion: "Ya existe un usuario con esta identificación",
      },
    };
  }

  if (objetivo.includes("email")) {
    return {
      ok: false,
      mensaje: "Ese correo ya está registrado.",
      errores: { email: "Ya existe un usuario con este correo" },
    };
  }
  return { ok: false, mensaje: "El registro duplica un valor único." };
}

/** Las oficinas referenciadas deben pertenecer a la compañía de quien administra. */
async function oficinasValidas(companiaId: string, ids: string[]) {
  if (ids.length === 0) return true;
  const encontradas = await prisma.oficina.count({
    where: { id: { in: ids }, companiaId },
  });
  return encontradas === ids.length;
}

// ------------------------------------------------------------------ crear

export async function crearUsuario(entrada: unknown): Promise<ResultadoAccion> {
  const ctx = await exigirAdminCompania();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaCrearUsuario.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  const referenciadas = [
    ...(datos.oficinaId ? [datos.oficinaId] : []),
    ...datos.oficinasIds,
  ];
  if (!(await oficinasValidas(ctx.companiaId, referenciadas))) {
    return { ok: false, mensaje: "La oficina seleccionada no es válida." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const creado = await tx.usuario.create({
        data: {
          companiaId: ctx.companiaId,
          email: datos.email,
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          numeroIdentificacion: datos.numeroIdentificacion,
          telefonoWhatsapp: datos.telefonoWhatsapp,
          rolCodigo: datos.rolCodigo,
          oficinaId: datos.rolCodigo === "GESTOR" ? datos.oficinaId : null,
          createdBy: ctx.usuarioId,
        },
      });

      // RN-16: al crear un Gestor se generan los 4 canales, deshabilitados.
      if (datos.rolCodigo === "GESTOR") {
        await tx.usuarioCanal.createMany({
          data: CANALES.map((canalCodigo) => ({
            companiaId: ctx.companiaId,
            usuarioId: creado.id,
            canalCodigo,
            habilitado: false,
          })),
        });
      }

      // RN-13: las oficinas del Líder viven en la relación N:M.
      if (datos.rolCodigo === "LIDER") {
        await tx.usuarioOficina.createMany({
          data: datos.oficinasIds.map((oficinaId) => ({
            companiaId: ctx.companiaId,
            usuarioId: creado.id,
            oficinaId,
            createdBy: ctx.usuarioId,
          })),
        });
      }

      await registrarAuditoria(tx, {
        tabla: "usuario",
        registroId: creado.id,
        operacion: "INSERT",
        usuarioId: ctx.usuarioId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresNuevos: {
          email: creado.email,
          nombres: creado.nombres,
          apellidos: creado.apellidos,
          numeroIdentificacion: creado.numeroIdentificacion,
          telefonoWhatsapp: creado.telefonoWhatsapp,
          rolCodigo: creado.rolCodigo,
          oficinaId: creado.oficinaId,
          estado: creado.estado,
        },
      });
    });
  } catch (error) {
    const duplicado = errorDeDuplicado(error);
    if (duplicado) return duplicado;
    console.error("[crearUsuario]", error);
    return { ok: false, mensaje: "No se pudo crear el usuario." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

// ------------------------------------------------------------- actualizar

export async function actualizarUsuario(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirAdminCompania();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaActualizarUsuario.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  // El usuario debe existir y ser de la misma compañía: sin este filtro se
  // podría editar a alguien de otra compañía pasando su id.
  const actual = await prisma.usuario.findFirst({
    where: { id: datos.id, companiaId: ctx.companiaId },
    select: {
      id: true,
      email: true,
      nombres: true,
      apellidos: true,
      numeroIdentificacion: true,
      telefonoWhatsapp: true,
      rolCodigo: true,
      oficinaId: true,
      estado: true,
    },
  });
  if (!actual) return NO_AUTORIZADO;
  if (!esAdministrableAqui(actual.rolCodigo)) return FUERA_DE_ALCANCE;

  const referenciadas = [
    ...(datos.oficinaId ? [datos.oficinaId] : []),
    ...datos.oficinasIds,
  ];
  if (!(await oficinasValidas(ctx.companiaId, referenciadas))) {
    return { ok: false, mensaje: "La oficina seleccionada no es válida." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const actualizado = await tx.usuario.update({
        where: { id: actual.id },
        data: {
          // El correo no se toca: RN-12 lo declara inmutable.
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          numeroIdentificacion: datos.numeroIdentificacion,
          telefonoWhatsapp: datos.telefonoWhatsapp,
          rolCodigo: datos.rolCodigo,
          oficinaId: datos.rolCodigo === "GESTOR" ? datos.oficinaId : null,
          updatedBy: ctx.usuarioId,
        },
      });

      // Al cambiar de rol hay que reconciliar lo que solo aplica a ciertos roles.
      if (datos.rolCodigo === "GESTOR") {
        for (const canalCodigo of CANALES) {
          await tx.usuarioCanal.upsert({
            where: {
              usuarioId_canalCodigo: { usuarioId: actual.id, canalCodigo },
            },
            update: {},
            create: {
              companiaId: ctx.companiaId,
              usuarioId: actual.id,
              canalCodigo,
              habilitado: false,
            },
          });
        }
      } else {
        await tx.usuarioCanal.deleteMany({ where: { usuarioId: actual.id } });
      }

      if (datos.rolCodigo === "LIDER") {
        await tx.usuarioOficina.deleteMany({
          where: {
            usuarioId: actual.id,
            oficinaId: { notIn: datos.oficinasIds },
          },
        });
        for (const oficinaId of datos.oficinasIds) {
          await tx.usuarioOficina.upsert({
            where: { usuarioId_oficinaId: { usuarioId: actual.id, oficinaId } },
            update: { vigente: true },
            create: {
              companiaId: ctx.companiaId,
              usuarioId: actual.id,
              oficinaId,
              createdBy: ctx.usuarioId,
            },
          });
        }
      } else {
        await tx.usuarioOficina.deleteMany({ where: { usuarioId: actual.id } });
      }

      await registrarAuditoria(tx, {
        tabla: "usuario",
        registroId: actual.id,
        operacion: "UPDATE",
        usuarioId: ctx.usuarioId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresAnteriores: actual,
        valoresNuevos: {
          nombres: actualizado.nombres,
          apellidos: actualizado.apellidos,
          numeroIdentificacion: actualizado.numeroIdentificacion,
          telefonoWhatsapp: actualizado.telefonoWhatsapp,
          rolCodigo: actualizado.rolCodigo,
          oficinaId: actualizado.oficinaId,
        },
      });
    });
  } catch (error) {
    const duplicado = errorDeDuplicado(error);
    if (duplicado) return duplicado;
    console.error("[actualizarUsuario]", error);
    return { ok: false, mensaje: "No se pudo actualizar el usuario." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

// --------------------------------------------------------- cambiar estado

/**
 * RN-06: no hay borrado, lo máximo es cambiar el estado a INACTIVO. Se audita
 * como CAMBIO_ESTADO, que es una operación propia del enum del spec.
 */
export async function cambiarEstadoUsuario(
  usuarioId: string,
): Promise<ResultadoAccion> {
  const ctx = await exigirAdminCompania();
  if (!ctx) return NO_AUTORIZADO;

  const actual = await prisma.usuario.findFirst({
    where: { id: usuarioId, companiaId: ctx.companiaId },
    select: { id: true, estado: true, rolCodigo: true },
  });
  if (!actual) return NO_AUTORIZADO;
  if (!esAdministrableAqui(actual.rolCodigo)) return FUERA_DE_ALCANCE;

  const nuevo = actual.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

  try {
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: actual.id },
        data: { estado: nuevo, updatedBy: ctx.usuarioId },
      });

      await registrarAuditoria(tx, {
        tabla: "usuario",
        registroId: actual.id,
        operacion: "CAMBIO_ESTADO",
        usuarioId: ctx.usuarioId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresAnteriores: { estado: actual.estado },
        valoresNuevos: { estado: nuevo },
      });
    });
  } catch (error) {
    console.error("[cambiarEstadoUsuario]", error);
    return { ok: false, mensaje: "No se pudo cambiar el estado." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

// ----------------------------------------------------------------- canales

/**
 * Habilita o inhabilita un canal del Gestor (CRM.docx §4.2).
 *
 * RN-18 pide que el backend revalide el permiso de canal y no confíe en la UI.
 * El espejo de eso acá es revalidar que el objetivo sea un GESTOR de la misma
 * compañía antes de tocar nada (RN-15: los canales solo aplican a ese rol).
 */
export async function alternarCanal(
  usuarioId: string,
  canalCodigo: string,
): Promise<ResultadoAccion> {
  const ctx = await exigirAdminCompania();
  if (!ctx) return NO_AUTORIZADO;

  if (!(CANALES as readonly string[]).includes(canalCodigo)) {
    return { ok: false, mensaje: "Canal desconocido." };
  }

  const objetivo = await prisma.usuario.findFirst({
    where: { id: usuarioId, companiaId: ctx.companiaId, rolCodigo: "GESTOR" },
    select: { id: true },
  });
  if (!objetivo) return NO_AUTORIZADO;

  const actual = await prisma.usuarioCanal.findUnique({
    where: { usuarioId_canalCodigo: { usuarioId, canalCodigo } },
    select: { id: true, habilitado: true },
  });
  if (!actual) return { ok: false, mensaje: "El canal no está configurado." };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.usuarioCanal.update({
        where: { id: actual.id },
        data: { habilitado: !actual.habilitado, updatedBy: ctx.usuarioId },
      });

      await registrarAuditoria(tx, {
        tabla: "usuario_canal",
        registroId: usuarioId,
        operacion: "UPDATE",
        usuarioId: ctx.usuarioId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresAnteriores: { canalCodigo, habilitado: actual.habilitado },
        valoresNuevos: { canalCodigo, habilitado: !actual.habilitado },
      });
    });
  } catch (error) {
    console.error("[alternarCanal]", error);
    return { ok: false, mensaje: "No se pudo actualizar el canal." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}
