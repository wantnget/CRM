import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { esRolConocido, type RolCodigo } from "@/lib/navegacion";

/**
 * Contexto de presentación del usuario autenticado.
 *
 * La sesión de better-auth trae `companiaId` y `oficinaId`, pero son UUIDs: el
 * sidebar y el encabezado necesitan los nombres para mostrar ("Fondo Want",
 * "Oficina Norte", la hora de cierre). Se resuelven acá con una sola consulta.
 *
 * No se guardan como campos de la sesión a propósito: quedarían denormalizados
 * dentro de la cookie y desactualizados si se renombra la compañía.
 */
export type ContextoUsuario = {
  usuario: {
    id: string;
    nombres: string;
    apellidos: string;
    nombreCompleto: string;
    iniciales: string;
    email: string;
  };
  rol: {
    codigo: RolCodigo;
    nombre: string;
  };
  compania: {
    id: string;
    razonSocial: string;
    horaCierreSesion: string;
  } | null;
  oficina: {
    id: string;
    nombre: string;
  } | null;
};

function iniciales(nombres: string, apellidos: string): string {
  const a = nombres.trim().charAt(0);
  const b = apellidos.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "?";
}

/**
 * `cache()` de React memoiza por request, así que el layout, el sidebar y el
 * encabezado comparten una sola consulta.
 */
export const obtenerContextoUsuario = cache(
  async (): Promise<ContextoUsuario | null> => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        estado: true,
        rol: { select: { codigo: true, nombre: true } },
        compania: {
          select: { id: true, razonSocial: true, horaCierreSesion: true },
        },
        oficina: { select: { id: true, nombre: true } },
      },
    });

    // RN-11: un usuario inactivo no opera. El hook de better-auth ya impide
    // crear la sesión, esto cubre el caso de que lo inactiven con la sesión
    // abierta.
    if (!usuario || usuario.estado !== "ACTIVO") return null;
    if (!esRolConocido(usuario.rol.codigo)) return null;

    return {
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        nombreCompleto: `${usuario.nombres} ${usuario.apellidos}`.trim(),
        iniciales: iniciales(usuario.nombres, usuario.apellidos),
        email: usuario.email,
      },
      rol: { codigo: usuario.rol.codigo, nombre: usuario.rol.nombre },
      compania: usuario.compania,
      oficina: usuario.oficina,
    };
  },
);
