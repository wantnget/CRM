/**
 * Cálculo de la ventana de sesión.
 *
 * PA-04 del spec quedaba abierta ("la duración de la ventana de sesión no está
 * definida"). El prototipo la resolvió: no es una duración desde el login, es
 * una hora fija diaria por compañía (`compania.hora_cierre_sesion`). Este
 * módulo traduce esa hora local al instante UTC en que la sesión debe cerrarse,
 * y alimenta el hook `session.create.before` de src/lib/auth.ts (RN-28).
 */

/**
 * Colombia no aplica horario de verano, así que el offset es fijo. El spec
 * guarda timestamptz en UTC y presenta en America/Bogota (UTC-5).
 */
const BOGOTA_UTC_OFFSET_MS = -5 * 60 * 60 * 1000;

const UN_DIA_MS = 24 * 60 * 60 * 1000;

/** Igual que el default de `compania.hora_cierre_sesion` en el schema. */
export const HORA_CIERRE_POR_DEFECTO = "18:30";

function parseHoraLocal(hora: string): { horas: number; minutos: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
  if (!match) return null;

  const horas = Number(match[1]);
  const minutos = Number(match[2]);
  if (horas > 23 || minutos > 59) return null;

  return { horas, minutos };
}

/**
 * Devuelve el instante UTC de la próxima ocurrencia de `horaCierre` (hora local
 * de Bogotá). Si hoy ya pasó, devuelve la de mañana.
 *
 * @param horaCierre Formato "HH:MM". Si es inválida se usa el default.
 * @param ahora Instante de referencia; parametrizable para pruebas.
 */
export function proximoCierreProgramado(
  horaCierre: string | null | undefined,
  ahora: Date = new Date(),
): Date {
  const hora =
    parseHoraLocal(horaCierre ?? HORA_CIERRE_POR_DEFECTO) ??
    parseHoraLocal(HORA_CIERRE_POR_DEFECTO)!;

  // Corremos el reloj al huso de Bogotá para leer el día calendario local.
  const ahoraLocal = new Date(ahora.getTime() + BOGOTA_UTC_OFFSET_MS);

  const cierreLocalMs = Date.UTC(
    ahoraLocal.getUTCFullYear(),
    ahoraLocal.getUTCMonth(),
    ahoraLocal.getUTCDate(),
    hora.horas,
    hora.minutos,
    0,
    0,
  );

  let cierreUtcMs = cierreLocalMs - BOGOTA_UTC_OFFSET_MS;
  if (cierreUtcMs <= ahora.getTime()) cierreUtcMs += UN_DIA_MS;

  return new Date(cierreUtcMs);
}
