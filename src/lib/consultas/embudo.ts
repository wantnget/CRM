import { prisma } from "@/lib/prisma";
import type { AlcanceResultados, RangoPeriodo } from "@/lib/consultas/resultados";

/**
 * Embudo de prospección: distribución de oportunidades por etapa.
 *
 * Las tres columnas de estado del modelo se combinan en cuatro casillas. La que
 * manda es `etapa`; `resultado_cierre` solo desempata el cierre:
 *
 *   CONTACTO            etapa = CONTACTO
 *   OFERTA              etapa = OFERTA
 *   FINALIZA – VENTA    etapa = CIERRE  y  resultado_cierre = VENTA
 *   FINALIZA – NO VENTA etapa = CIERRE  y  resultado_cierre = NO_VENTA
 *
 * Se cuentan TODAS las oportunidades del rango, abiertas y cerradas. Filtrar
 * por `estado = PROSPECCION` dejaría las dos casillas de cierre en cero por
 * construcción, porque una oportunidad cerrada tiene estado CERRADO.
 *
 * Que la etapa mande también hace visible la anomalía INC-04 del spec (filas en
 * estado PROSPECCION con etapa CIERRE) en vez de esconderla.
 *
 * A diferencia de Resultados Comerciales, acá se cuentan oportunidades y no
 * valores, así que sumar entre productos es legítimo: RN-56 no aplica.
 */

export const ETAPAS_EMBUDO = [
  "CONTACTO",
  "OFERTA",
  "VENTA",
  "NO_VENTA",
] as const;

export type EtapaEmbudo = (typeof ETAPAS_EMBUDO)[number];

export type ConteoEtapas = Record<EtapaEmbudo, number>;

export type EmbudoProducto = {
  productoCodigo: string;
  productoNombre: string;
  conteos: ConteoEtapas;
  total: number;
  /** Las que siguen en juego: contacto u oferta. */
  activas: number;
};

export type Embudo = {
  totales: ConteoEtapas;
  total: number;
  activas: number;
  productos: EmbudoProducto[];
};

function vacio(): ConteoEtapas {
  return { CONTACTO: 0, OFERTA: 0, VENTA: 0, NO_VENTA: 0 };
}

function filtroPeriodo(rango: RangoPeriodo) {
  return rango.tipo === "mes"
    ? { periodo: rango.periodo }
    : { periodo: { startsWith: `${rango.anio}-` } };
}

function filtroAlcance(alcance: AlcanceResultados) {
  switch (alcance.rol) {
    case "GESTOR":
      return { companiaId: alcance.companiaId, gestorId: alcance.gestorId };
    case "LIDER":
      return { companiaId: alcance.companiaId, liderId: alcance.liderId };
    case "DIRECTOR":
      return { companiaId: alcance.companiaId };
  }
}

/** Traduce etapa + resultado a la casilla del embudo. */
function casillaDe(
  etapa: string,
  resultadoCierre: string | null,
): EtapaEmbudo | null {
  if (etapa === "CONTACTO") return "CONTACTO";
  if (etapa === "OFERTA") return "OFERTA";
  if (etapa === "CIERRE") {
    if (resultadoCierre === "VENTA") return "VENTA";
    if (resultadoCierre === "NO_VENTA") return "NO_VENTA";
  }
  // El CHECK ck_oportunidad_cierre_coherente lo impide, pero si apareciera una
  // fila incoherente se descarta en vez de contarla mal.
  return null;
}

export async function obtenerEmbudo(
  alcance: AlcanceResultados,
  rango: RangoPeriodo,
): Promise<Embudo> {
  const [productos, filas] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      select: { codigo: true, nombre: true },
      orderBy: { orden: "asc" },
    }),

    prisma.oportunidad.groupBy({
      by: ["productoCodigo", "etapa", "resultadoCierre"],
      where: { ...filtroAlcance(alcance), ...filtroPeriodo(rango) },
      _count: { _all: true },
    }),
  ]);

  const porProducto = new Map<string, ConteoEtapas>(
    productos.map((p) => [p.codigo, vacio()]),
  );
  const totales = vacio();

  for (const fila of filas) {
    const casilla = casillaDe(fila.etapa, fila.resultadoCierre);
    if (!casilla) continue;

    const conteos = porProducto.get(fila.productoCodigo);
    // Un producto inactivo puede tener historia; no se lista pero tampoco se
    // suma al total, para que las tarjetas y el encabezado cuadren.
    if (!conteos) continue;

    conteos[casilla] += fila._count._all;
    totales[casilla] += fila._count._all;
  }

  const suma = (c: ConteoEtapas) =>
    c.CONTACTO + c.OFERTA + c.VENTA + c.NO_VENTA;

  return {
    totales,
    total: suma(totales),
    activas: totales.CONTACTO + totales.OFERTA,
    productos: productos.map((p) => {
      const conteos = porProducto.get(p.codigo)!;
      return {
        productoCodigo: p.codigo,
        productoNombre: p.nombre,
        conteos,
        total: suma(conteos),
        activas: conteos.CONTACTO + conteos.OFERTA,
      };
    }),
  };
}
