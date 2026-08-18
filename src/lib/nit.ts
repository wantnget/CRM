/**
 * Dígito de verificación del NIT (algoritmo de la DIAN).
 *
 * El spec deja `compania.digito_verificacion` como "campo sugerido, no presente
 * en el documento funcional". Como es determinista a partir del NIT, se calcula
 * en vez de pedirlo, y la UI permite corregirlo a mano por si el NIT registrado
 * en la Cámara de Comercio trae otro.
 */

/** Pesos de la DIAN, aplicados de derecha a izquierda sobre el NIT. */
const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/** Deja solo dígitos: el NIT se suele escribir con puntos o guiones. */
export function normalizarNit(nit: string): string {
  return nit.replace(/\D/g, "");
}

/**
 * Devuelve el dígito de verificación (0-9), o `null` si el NIT no es utilizable
 * (vacío, no numérico o más largo que los pesos definidos).
 */
export function calcularDigitoVerificacion(nit: string): string | null {
  const digitos = normalizarNit(nit);
  if (digitos.length === 0 || digitos.length > PESOS.length) return null;

  let suma = 0;
  for (let i = 0; i < digitos.length; i++) {
    // Se recorre de derecha a izquierda emparejando con el peso i-ésimo.
    const digito = Number(digitos[digitos.length - 1 - i]);
    suma += digito * PESOS[i];
  }

  const resto = suma % 11;
  // Con resto 0 o 1 el dígito es el propio resto; en el resto de casos, 11-resto.
  // El resultado siempre cae entre 0 y 9, así que entra en la columna char(1).
  return String(resto < 2 ? resto : 11 - resto);
}
