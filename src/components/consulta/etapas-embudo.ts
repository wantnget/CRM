/**
 * Las cuatro etapas que se muestran. Se declaran acá y no se importan de una
 * consulta, para que la píldora de la bandeja de Prospección no dependa del
 * módulo de Consulta.
 */
export type EtapaEmbudo = "CONTACTO" | "OFERTA" | "VENTA" | "NO_VENTA";

/**
 * Presentación de las cuatro etapas del embudo.
 *
 * Los colores viven en globals.css como tokens `--etapa-*`, con la nota de por
 * qué el verde no es el de la guía de estilo y por qué las etiquetas usan un
 * tono más oscuro que la barra.
 */
export const ETAPAS: {
  id: EtapaEmbudo;
  etiqueta: string;
  /** Color de la marca: la barra. */
  fondo: string;
  /** Color del texto: mismo tono, más oscuro, para que cumpla AA. */
  texto: string;
}[] = [
  {
    id: "CONTACTO",
    etiqueta: "Contacto",
    fondo: "bg-etapa-contacto",
    texto: "text-etapa-contacto-texto",
  },
  {
    id: "OFERTA",
    etiqueta: "Oferta",
    fondo: "bg-etapa-oferta",
    texto: "text-etapa-oferta-texto",
  },
  {
    id: "VENTA",
    etiqueta: "Finaliza – Venta",
    fondo: "bg-etapa-venta",
    texto: "text-etapa-venta-texto",
  },
  {
    id: "NO_VENTA",
    etiqueta: "Finaliza – No Venta",
    fondo: "bg-etapa-no-venta",
    texto: "text-etapa-no-venta-texto",
  },
];
