import { prisma } from "@/lib/prisma";
import type { UnidadMedida } from "@/lib/formato";

/**
 * Resultados comerciales: cruce de ventas contra metas por producto.
 *
 * Alimenta la pestaña "Resultados Comerciales" de las tres consultas
 * (CRM.docx §5.2, §6.2, §7.2). El alcance de los datos cambia por rol, así que
 * se parametriza en vez de hardcodear el del Gestor.
 *
 * El spec define una vista materializada `vw_resultados_comerciales` para esto,
 * pero deja el refresco sin definir (RN-57 / PA-11). Con la volumetría actual
 * dos agregaciones y un cruce en memoria resuelven en milisegundos, así que se
 * hace directo y la vista queda para cuando la volumetría lo pida. Las páginas
 * consumen esta función, no las tablas, así que cambiar la fuente por dentro no
 * las toca.
 */

/**
 * Alcance de datos por rol, según la matriz de visibilidad del spec.
 *
 * `companiaId` va en los tres: mientras no exista la RLS que pide el spec, es
 * la única barrera de aislamiento multi-tenant.
 */
export type AlcanceResultados =
  | { rol: "GESTOR"; companiaId: string; gestorId: string }
  | { rol: "LIDER"; companiaId: string; liderId: string }
  | { rol: "DIRECTOR"; companiaId: string };

/** Mes puntual o acumulado del año en curso (CRM.docx §7.2 pide ambos). */
export type RangoPeriodo =
  | { tipo: "mes"; periodo: string }
  | { tipo: "anio"; anio: string };

export type ResultadoProducto = {
  productoCodigo: string;
  productoNombre: string;
  unidadMedida: UnidadMedida;
  /** Vendido: solo oportunidades cerradas con resultado VENTA (RN-39). */
  real: number;
  /** `null` cuando el producto no tiene meta en el rango (RN-55). */
  meta: number | null;
  /** `null` cuando no hay meta contra la cual medir. */
  cumplimiento: number | null;
};

function filtroPeriodo(rango: RangoPeriodo) {
  // El periodo es char(7) 'YYYY-MM', así que el año se filtra por prefijo.
  return rango.tipo === "mes"
    ? { periodo: rango.periodo }
    : { periodo: { startsWith: `${rango.anio}-` } };
}

function filtroVentas(alcance: AlcanceResultados) {
  switch (alcance.rol) {
    case "GESTOR":
      return { companiaId: alcance.companiaId, gestorId: alcance.gestorId };
    case "LIDER":
      // lider_id está denormalizado en la oportunidad justamente para que la
      // atribución histórica no cambie si el gestor cambia de líder.
      return { companiaId: alcance.companiaId, liderId: alcance.liderId };
    case "DIRECTOR":
      return { companiaId: alcance.companiaId };
  }
}

function filtroMetas(alcance: AlcanceResultados) {
  switch (alcance.rol) {
    case "GESTOR":
      return { companiaId: alcance.companiaId, usuarioId: alcance.gestorId };
    case "LIDER":
      return { companiaId: alcance.companiaId, liderId: alcance.liderId };
    case "DIRECTOR":
      return { companiaId: alcance.companiaId };
  }
}

export async function obtenerResultados(
  alcance: AlcanceResultados,
  rango: RangoPeriodo,
): Promise<ResultadoProducto[]> {
  const periodo = filtroPeriodo(rango);

  const [productos, ventas, metas] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      select: { codigo: true, nombre: true, unidadMedida: true },
      orderBy: { orden: "asc" },
    }),

    // RN-39: al dashboard solo suman las oportunidades efectivamente vendidas.
    prisma.oportunidad.groupBy({
      by: ["productoCodigo"],
      where: {
        ...filtroVentas(alcance),
        ...periodo,
        estado: "CERRADO",
        resultadoCierre: "VENTA",
      },
      _sum: { cantidad: true, monto: true },
    }),

    prisma.meta.groupBy({
      by: ["productoCodigo"],
      where: { ...filtroMetas(alcance), ...periodo },
      _sum: { metaCantidad: true, metaMonto: true },
    }),
  ]);

  const ventaPorProducto = new Map(ventas.map((v) => [v.productoCodigo, v]));
  const metaPorProducto = new Map(metas.map((m) => [m.productoCodigo, m]));

  // RN-55: el cruce es un FULL OUTER JOIN. Se recorre el catálogo completo para
  // que aparezcan tanto las metas sin venta (cumplimiento 0%) como las ventas
  // sin meta, que quedan con meta nula y sin porcentaje.
  return productos.map((producto) => {
    const esMonto = producto.unidadMedida === "MONTO";
    const venta = ventaPorProducto.get(producto.codigo);
    const meta = metaPorProducto.get(producto.codigo);

    const real = Number(
      (esMonto ? venta?._sum.monto : venta?._sum.cantidad) ?? 0,
    );

    const metaBruta = esMonto ? meta?._sum.metaMonto : meta?._sum.metaCantidad;
    const metaValor = metaBruta == null ? null : Number(metaBruta);

    return {
      productoCodigo: producto.codigo,
      productoNombre: producto.nombre,
      unidadMedida: producto.unidadMedida as UnidadMedida,
      real,
      meta: metaValor,
      cumplimiento:
        metaValor && metaValor > 0 ? (real / metaValor) * 100 : null,
    };
  });
}
