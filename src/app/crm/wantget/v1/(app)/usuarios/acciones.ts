"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obtenerContextoUsuario } from "@/lib/contexto-usuario";
import { Prisma } from "@/generated/prisma/client";
import { ipDeLaSolicitud, registrarAuditoria } from "@/lib/auditoria";
import { mapearDuplicado } from "@/lib/errores-prisma";
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

/**
 * Códigos del catálogo de canales, leídos de la base.
 *
 * Estaban en una constante con los cuatro originales, y al agregarse LLAMADA el
 * canal quedó fuera de las tres cosas que dependían de la lista: no se creaba
 * al dar de alta un Gestor, no pasaba la validación de `alternarCanal` y no
 * tenía etiqueta. El catálogo es `canal_comunicacion`; leerlo de ahí hace que
 * un canal nuevo funcione sin tocar código.
 */
async function codigosDeCanal(): Promise<string[]> {
  const canales = await prisma.canalComunicacion.findMany({
    select: { codigo: true },
    orderBy: { orden: "asc" },
  });
  return canales.map((canal) => canal.codigo);
}

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
 * Traduce la violación de índice único a un mensaje por campo.
 *
 * El nombre de la restricción se resuelve en lib/errores-prisma.ts, que
 * contempla que Prisma 7 con driver adapter no pobla meta.target.
 */
function errorDeDuplicado(error: unknown): ResultadoAccion | null {
  return mapearDuplicado<ResultadoAccion>(error, [
    // Primero el más específico: usuario_email_key no contiene esta clave.
    [
      "numero_identificacion",
      {
        ok: false,
        mensaje: "Esa identificación ya está registrada en la compañía.",
        errores: {
          numeroIdentificacion: "Ya existe un usuario con esta identificación",
        },
      },
    ],
    [
      "email",
      {
        ok: false,
        mensaje: "Ese correo ya está registrado.",
        errores: { email: "Ya existe un usuario con este correo" },
      },
    ],
    ["", { ok: false, mensaje: "El registro duplica un valor único." }],
  ]);
}

/**
 * Fecha de hoy en Bogotá, normalizada a medianoche UTC para una columna date.
 * Sin esto, un cambio hecho después de las 19:00 local caería en el día
 * siguiente, porque Colombia es UTC-5.
 */
function hoyEnBogota(): Date {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - 5 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()),
  );
}

/** El líder debe ser un LIDER activo de la misma compañía (RN-20). */
async function liderValido(companiaId: string, liderId: string) {
  const encontrado = await prisma.usuario.count({
    where: { id: liderId, companiaId, rolCodigo: "LIDER", estado: "ACTIVO" },
  });
  return encontrado === 1;
}

/**
 * Deja al gestor con un único líder vigente (RN-19).
 *
 * vigente_hasta se maneja como límite exclusivo: la asignación anterior se
 * cierra con la misma fecha en que arranca la nueva, así no hay solapamiento.
 * Si el cambio ocurre el mismo día en que empezó la vigente, se corrige en el
 * lugar para no dejar rangos de duración cero.
 *
 * Devuelve null cuando no hubo cambio.
 */
async function reasignarLider(
  tx: Prisma.TransactionClient,
  ctx: Contexto,
  gestorId: string,
  liderId: string | null,
) {
  const vigente = await tx.asignacionGestorLider.findFirst({
    where: { gestorId, vigenteHasta: null },
    orderBy: { vigenteDesde: "desc" },
  });

  if (!liderId) {
    // Dejó de ser Gestor: se cierra la vigencia y no se abre otra.
    if (!vigente) return null;
    await tx.asignacionGestorLider.update({
      where: { id: vigente.id },
      data: { vigenteHasta: hoyEnBogota() },
    });
    return { anterior: vigente.liderId, nuevo: null };
  }

  if (vigente?.liderId === liderId) return null;

  const hoy = hoyEnBogota();

  if (vigente) {
    if (vigente.vigenteDesde.getTime() === hoy.getTime()) {
      await tx.asignacionGestorLider.update({
        where: { id: vigente.id },
        data: { liderId },
      });
      return { anterior: vigente.liderId, nuevo: liderId };
    }
    await tx.asignacionGestorLider.update({
      where: { id: vigente.id },
      data: { vigenteHasta: hoy },
    });
  }

  await tx.asignacionGestorLider.create({
    data: {
      companiaId: ctx.companiaId,
      gestorId,
      liderId,
      vigenteDesde: hoy,
      createdBy: ctx.usuarioId,
    },
  });

  return { anterior: vigente?.liderId ?? null, nuevo: liderId };
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

  if (
    datos.rolCodigo === "GESTOR" &&
    datos.liderId &&
    !(await liderValido(ctx.companiaId, datos.liderId))
  ) {
    return {
      ok: false,
      mensaje: "El líder seleccionado no es válido.",
      errores: { liderId: "Selecciona un Líder activo de la compañía" },
    };
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

      // RN-16: al crear un Gestor se generan todos los canales del catálogo,
      // deshabilitados.
      if (datos.rolCodigo === "GESTOR") {
        await tx.usuarioCanal.createMany({
          data: (await codigosDeCanal()).map((canalCodigo) => ({
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

      // RN-19 / RN-20: el Gestor arranca con su Líder vigente.
      if (datos.rolCodigo === "GESTOR" && datos.liderId) {
        await tx.asignacionGestorLider.create({
          data: {
            companiaId: ctx.companiaId,
            gestorId: creado.id,
            liderId: datos.liderId,
            vigenteDesde: hoyEnBogota(),
            createdBy: ctx.usuarioId,
          },
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
          liderId: datos.rolCodigo === "GESTOR" ? datos.liderId : null,
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

  if (
    datos.rolCodigo === "GESTOR" &&
    datos.liderId &&
    !(await liderValido(ctx.companiaId, datos.liderId))
  ) {
    return {
      ok: false,
      mensaje: "El líder seleccionado no es válido.",
      errores: { liderId: "Selecciona un Líder activo de la compañía" },
    };
  }

  // Nadie puede ser su propio líder.
  if (datos.rolCodigo === "GESTOR" && datos.liderId === actual.id) {
    return {
      ok: false,
      mensaje: "Un usuario no puede ser su propio líder.",
      errores: { liderId: "Selecciona otro Líder" },
    };
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
        for (const canalCodigo of await codigosDeCanal()) {
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

      // Al dejar de ser Gestor se cierra la vigencia; si sigue siéndolo, se
      // reasigna solo cuando el líder cambió.
      const cambioDeLider = await reasignarLider(
        tx,
        ctx,
        actual.id,
        datos.rolCodigo === "GESTOR" ? (datos.liderId ?? null) : null,
      );

      if (cambioDeLider) {
        await registrarAuditoria(tx, {
          tabla: "asignacion_gestor_lider",
          registroId: actual.id,
          operacion: "UPDATE",
          usuarioId: ctx.usuarioId,
          companiaId: ctx.companiaId,
          ip: ctx.ip,
          valoresAnteriores: { liderId: cambioDeLider.anterior },
          valoresNuevos: { liderId: cambioDeLider.nuevo },
        });
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

  const canal = await prisma.canalComunicacion.findUnique({
    where: { codigo: canalCodigo },
    select: { codigo: true },
  });
  if (!canal) return { ok: false, mensaje: "Canal desconocido." };

  const objetivo = await prisma.usuario.findFirst({
    where: { id: usuarioId, companiaId: ctx.companiaId, rolCodigo: "GESTOR" },
    select: { id: true },
  });
  if (!objetivo) return NO_AUTORIZADO;

  const actual = await prisma.usuarioCanal.findUnique({
    where: { usuarioId_canalCodigo: { usuarioId, canalCodigo } },
    select: { habilitado: true },
  });

  // Sin fila, el canal está de hecho inhabilitado, así que alternar lo habilita.
  // Se crea en vez de rechazar: los Gestores dados de alta antes de que
  // existiera un canal no tienen su fila, y no deberían quedar sin poder
  // habilitarlo.
  const habilitado = !(actual?.habilitado ?? false);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.usuarioCanal.upsert({
        where: { usuarioId_canalCodigo: { usuarioId, canalCodigo } },
        update: { habilitado, updatedBy: ctx.usuarioId },
        create: {
          companiaId: ctx.companiaId,
          usuarioId,
          canalCodigo,
          habilitado,
        },
      });

      await registrarAuditoria(tx, {
        tabla: "usuario_canal",
        registroId: usuarioId,
        operacion: actual ? "UPDATE" : "INSERT",
        usuarioId: ctx.usuarioId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresAnteriores: actual
          ? { canalCodigo, habilitado: actual.habilitado }
          : undefined,
        valoresNuevos: { canalCodigo, habilitado },
      });
    });
  } catch (error) {
    console.error("[alternarCanal]", error);
    return { ok: false, mensaje: "No se pudo actualizar el canal." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}
