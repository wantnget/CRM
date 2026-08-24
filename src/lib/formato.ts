/**
 * Formato de números y moneda en es-CO.
 *
 * El spec lo fija en consideraciones_no_funcionales: locale es-CO, separador de
 * miles punto, decimal coma, moneda COP. Los montos van sin decimales porque
 * así se presentan en el prototipo ("$ 5.000.000").
 */

const MONEDA = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const CANTIDAD = new Intl.NumberFormat("es-CO");

export type UnidadMedida = "UNIDADES" | "MONTO";

export function formatearMoneda(valor: number): string {
  return MONEDA.format(valor);
}

export function formatearCantidad(valor: number): string {
  return CANTIDAD.format(valor);
}

/**
 * Formatea según la unidad del producto. Es la barrera que impide mezclar
 * unidades con pesos: RN-56 prohíbe cualquier total que sume ambas.
 */
export function formatearValor(valor: number, unidad: UnidadMedida): string {
  return unidad === "MONTO" ? formatearMoneda(valor) : formatearCantidad(valor);
}

/** Periodo 'YYYY-MM' a la forma 'MM-YYYY' que usa la interfaz. */
export function formatearPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split("-");
  return `${mes}-${anio}`;
}

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Periodo 'YYYY-MM' en palabras, para títulos. */
export function nombrePeriodo(periodo: string): string {
  const [anio, mes] = periodo.split("-");
  return `${MESES[Number(mes) - 1] ?? mes} ${anio}`;
}

/**
 * Alias de los nombres que usa el módulo de Director/Líder y el de Metas. Son
 * las mismas reglas de formato: se exponen con los dos nombres en vez de
 * mantener dos implementaciones que puedan divergir.
 */
export const formatoUnidades = formatearCantidad;
export const formatoMonto = formatearMoneda;
export const formatoPorUnidadMedida = formatearValor;

const FECHA_HORA = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Fecha y hora en Bogotá, para sellos de cargue y bitácoras. */
export function formatoFechaHora(fecha: Date): string {
  return FECHA_HORA.format(fecha).replace(",", "");
}

/** Duración de una llamada en mm:ss. */
export function formatoDuracion(segundos: number): string {
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, "0");
  const s = (segundos % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Iniciales de un nombre completo, para los avatares sin foto. */
export function inicialesDe(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/);
  const a = partes[0]?.charAt(0) ?? "";
  const b = partes[1]?.charAt(0) ?? "";
  return `${a}${b}`.toUpperCase() || "?";
}
