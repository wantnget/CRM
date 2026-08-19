import { Prisma } from "@/generated/prisma/client";

/**
 * Lectura de las violaciones de unicidad de Prisma.
 *
 * Con driver adapter, Prisma 7 no pobla `meta.target` en el error P2002: deja
 * el error original de Postgres en `meta.driverAdapterError.cause.originalMessage`,
 * cuyo texto está localizado pero incluye el nombre de la restricción. Se
 * revisan las dos fuentes para no depender de una sola.
 */

export function esViolacionDeUnicidad(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/** Texto donde buscar el nombre de la restricción violada. */
export function restriccionViolada(
  error: Prisma.PrismaClientKnownRequestError,
): string {
  const meta = error.meta as
    | {
        target?: unknown;
        driverAdapterError?: { cause?: { originalMessage?: unknown } };
      }
    | undefined;

  return [
    Array.isArray(meta?.target)
      ? meta.target.join(",")
      : String(meta?.target ?? ""),
    String(meta?.driverAdapterError?.cause?.originalMessage ?? ""),
    error.message,
  ].join(" | ");
}

/**
 * Traduce un P2002 al primer par cuya clave aparezca en el nombre de la
 * restricción. El orden importa: hay nombres que contienen a otros, así que se
 * listan primero los más específicos.
 */
export function mapearDuplicado<T>(
  error: unknown,
  pares: [clave: string, resultado: T][],
): T | null {
  if (!esViolacionDeUnicidad(error)) return null;

  const objetivo = restriccionViolada(error);
  for (const [clave, resultado] of pares) {
    if (objetivo.includes(clave)) return resultado;
  }
  return null;
}
