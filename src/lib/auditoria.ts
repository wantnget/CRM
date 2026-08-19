import { headers } from "next/headers";
import type { OperacionAuditoria } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Registro de auditoría.
 *
 * El spec lo exige como convención transversal: "todas las tablas de negocio
 * llevan created_at, created_by, updated_at, updated_by. Los cambios se
 * replican en la tabla 'auditoria'". Y RN-53: la tabla es append-only, sin
 * UPDATE ni DELETE ni para administradores.
 *
 * Se recibe el cliente de transacción para que el registro entre en la misma
 * transacción que el cambio: si el cambio falla, no queda auditoría huérfana, y
 * si la auditoría falla, el cambio se revierte.
 */

/** Campos que nunca deben quedar en la auditoría (RN-54). */
const CAMPOS_SENSIBLES = new Set([
  "codigoHash",
  "codigo_hash",
  "token",
  "value",
  "password",
]);

type ValoresAuditables = Record<string, unknown> | null | undefined;

function limpiar(valores: ValoresAuditables): Prisma.InputJsonValue | undefined {
  if (!valores) return undefined;

  const salida: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(valores)) {
    if (CAMPOS_SENSIBLES.has(clave)) continue;
    // Las fechas y los Decimal de Prisma no son JSON serializable directo.
    salida[clave] = valor instanceof Date ? valor.toISOString() : valor;
  }
  return salida as Prisma.InputJsonValue;
}

/** IP del solicitante, para la columna `inet`. `null` si no se puede resolver. */
export async function ipDeLaSolicitud(): Promise<string | null> {
  const cabeceras = await headers();
  const reenviada = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = cabeceras.get("x-real-ip")?.trim();
  const ip = reenviada || real || null;

  // Postgres rechaza un inet inválido; ante la duda se guarda null.
  if (!ip) return null;
  const valida = /^[0-9.]+$/.test(ip) || /^[0-9a-fA-F:]+$/.test(ip);
  return valida ? ip : null;
}

export type EntradaAuditoria = {
  tabla: string;
  registroId: string;
  operacion: OperacionAuditoria;
  /** Usuario que ejecuta el cambio. */
  usuarioId: string | null;
  companiaId: string | null;
  sesionId?: string | null;
  valoresAnteriores?: ValoresAuditables;
  valoresNuevos?: ValoresAuditables;
  ip?: string | null;
};

export async function registrarAuditoria(
  tx: Prisma.TransactionClient,
  entrada: EntradaAuditoria,
) {
  await tx.auditoria.create({
    data: {
      tabla: entrada.tabla,
      registroId: entrada.registroId,
      operacion: entrada.operacion,
      usuarioId: entrada.usuarioId,
      companiaId: entrada.companiaId,
      sesionId: entrada.sesionId ?? null,
      valoresAnteriores: limpiar(entrada.valoresAnteriores),
      valoresNuevos: limpiar(entrada.valoresNuevos),
      ip: entrada.ip ?? null,
    },
  });
}
