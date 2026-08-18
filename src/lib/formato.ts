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
