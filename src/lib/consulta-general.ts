import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export type FiltroConsulta = {
  liderId?: string;
  gestorId?: string;
};

/**
 * Rango de imputación de la consulta: un mes o el acumulado del año.
 *
 * `periodo` es char(7) 'YYYY-MM', así que el acumulado se resuelve con un
 * prefijo en vez de un BETWEEN de fechas. Es el mismo criterio en Resultados y
 * en Embudo, para que las dos pestañas hablen del mismo recorte.
 */
export type RangoConsulta =
  | { tipo: "mes"; periodo: string }
  | { tipo: "anio"; anio: string };

function condicionPeriodo(rango: RangoConsulta) {
  return rango.tipo === "mes" ? rango.periodo : { startsWith: `${rango.anio}-` };
}

export type OpcionFiltro = { id: string; nombre: string };

export type OpcionGestorFiltro = OpcionFiltro & { liderId: string | null };

export type OpcionesFiltro = {
  lideres: OpcionFiltro[];
  gestores: OpcionGestorFiltro[];
};

function nombreCompleto(usuario: { nombres: string; apellidos: string }) {
  return `${usuario.nombres} ${usuario.apellidos}`;
}

/**
 * `soloLiderId` acota las opciones al equipo de ese líder (rol LIDER): no
 * tiene sentido ofrecerle el selector de Líder ni los gestores de otros
 * equipos si su vista ya está fija a los suyos.
 */
export async function opcionesFiltro(
  companiaId: string,
  soloLiderId?: string,
): Promise<OpcionesFiltro> {
  const [lideres, gestores] = await Promise.all([
    soloLiderId
      ? Promise.resolve([])
      : prisma.usuario.findMany({
          where: { companiaId, rolCodigo: "LIDER", estado: "ACTIVO" },
          select: { id: true, nombres: true, apellidos: true },
          orderBy: { nombres: "asc" },
        }),
    prisma.usuario.findMany({
      where: {
        companiaId,
        rolCodigo: "GESTOR",
        estado: "ACTIVO",
        ...(soloLiderId
          ? { comoGestorAsignaciones: { some: { liderId: soloLiderId, vigenteHasta: null } } }
          : {}),
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        // Asignación vigente (vigenteHasta null): es la que decide bajo qué
        // Líder cae el gestor hoy, para que el select de Gestor pueda
        // filtrarse según el Líder elegido.
        comoGestorAsignaciones: {
          where: { vigenteHasta: null },
          select: { liderId: true },
          take: 1,
        },
      },
      orderBy: { nombres: "asc" },
    }),
  ]);

  return {
    lideres: lideres.map((l) => ({ id: l.id, nombre: nombreCompleto(l) })),
    gestores: gestores.map((g) => ({
      id: g.id,
      nombre: nombreCompleto(g),
      liderId: g.comoGestorAsignaciones[0]?.liderId ?? null,
    })),
  };
}

// Ambos filtros se combinan con AND (no gestor-anula-líder): un LIDER trae
// liderId fijo a su propio id, y si además elige un gestor, el resultado debe
// seguir cumpliendo las dos condiciones. Con "gestor gana" un query armado a
// mano (?gestor=<id-de-otro-equipo>) se saltaría el alcance del líder.
function alcanceOportunidad(
  companiaId: string,
  filtro: FiltroConsulta,
): Prisma.OportunidadWhereInput {
  return {
    companiaId,
    ...(filtro.liderId ? { liderId: filtro.liderId } : {}),
    ...(filtro.gestorId ? { gestorId: filtro.gestorId } : {}),
  };
}

function alcanceMeta(companiaId: string, filtro: FiltroConsulta): Prisma.MetaWhereInput {
  return {
    companiaId,
    rolObjetivo: "GESTOR",
    ...(filtro.liderId ? { liderId: filtro.liderId } : {}),
    ...(filtro.gestorId ? { usuarioId: filtro.gestorId } : {}),
  };
}

export type ResultadoProducto = {
  codigo: string;
  nombre: string;
  unidadMedida: "UNIDADES" | "MONTO";
  real: number;
  presupuesto: number;
  cumplimiento: number | null;
};

export async function resultadosComerciales(
  companiaId: string,
  filtro: FiltroConsulta,
  rango: RangoConsulta,
): Promise<ResultadoProducto[]> {
  const periodo = condicionPeriodo(rango);

  const [productos, realPorProducto, presupuestoPorProducto] = await Promise.all([
    prisma.producto.findMany({ where: { activo: true }, orderBy: { orden: "asc" } }),
    prisma.oportunidad.groupBy({
      by: ["productoCodigo"],
      where: {
        ...alcanceOportunidad(companiaId, filtro),
        periodo,
        estado: "CERRADO",
        resultadoCierre: "VENTA",
      },
      _sum: { cantidad: true, monto: true },
    }),
    prisma.meta.groupBy({
      by: ["productoCodigo"],
      where: { ...alcanceMeta(companiaId, filtro), periodo },
      _sum: { metaCantidad: true, metaMonto: true },
    }),
  ]);

  const realMap = new Map(realPorProducto.map((fila) => [fila.productoCodigo, fila]));
  const presupuestoMap = new Map(
    presupuestoPorProducto.map((fila) => [fila.productoCodigo, fila]),
  );

  return productos.map((producto) => {
    const real = realMap.get(producto.codigo);
    const presupuesto = presupuestoMap.get(producto.codigo);
    const esMonto = producto.unidadMedida === "MONTO";

    const valorReal = esMonto ? Number(real?._sum.monto ?? 0) : (real?._sum.cantidad ?? 0);
    const valorPresupuesto = esMonto
      ? Number(presupuesto?._sum.metaMonto ?? 0)
      : (presupuesto?._sum.metaCantidad ?? 0);

    return {
      codigo: producto.codigo,
      nombre: producto.nombre,
      unidadMedida: producto.unidadMedida,
      real: valorReal,
      presupuesto: valorPresupuesto,
      cumplimiento:
        valorPresupuesto > 0 ? Math.round((valorReal / valorPresupuesto) * 100) : null,
    };
  });
}

export type ConteoEmbudo = {
  contacto: number;
  oferta: number;
  ventaFinal: number;
  noVentaFinal: number;
};

export type EmbudoProducto = {
  codigo: string;
  nombre: string;
  conteo: ConteoEmbudo;
};

export type Embudo = {
  global: ConteoEmbudo;
  porProducto: EmbudoProducto[];
};

function conteoVacio(): ConteoEmbudo {
  return { contacto: 0, oferta: 0, ventaFinal: 0, noVentaFinal: 0 };
}

function etapaDe(fila: {
  estado: string;
  etapa: string;
  resultadoCierre: string | null;
}): keyof ConteoEmbudo {
  if (fila.estado === "CERRADO") {
    return fila.resultadoCierre === "VENTA" ? "ventaFinal" : "noVentaFinal";
  }
  return fila.etapa === "CONTACTO" ? "contacto" : "oferta";
}

export async function embudo(
  companiaId: string,
  filtro: FiltroConsulta,
  rango: RangoConsulta,
): Promise<Embudo> {
  const periodo = condicionPeriodo(rango);

  const [productos, filas] = await Promise.all([
    prisma.producto.findMany({ where: { activo: true }, orderBy: { orden: "asc" } }),
    prisma.oportunidad.groupBy({
      by: ["productoCodigo", "estado", "etapa", "resultadoCierre"],
      where: { ...alcanceOportunidad(companiaId, filtro), periodo },
      _count: { _all: true },
    }),
  ]);

  const global = conteoVacio();
  const porProductoMap = new Map(productos.map((p) => [p.codigo, conteoVacio()]));

  for (const fila of filas) {
    const bucket = etapaDe(fila);
    global[bucket] += fila._count._all;
    const conteo = porProductoMap.get(fila.productoCodigo);
    if (conteo) conteo[bucket] += fila._count._all;
  }

  return {
    global,
    porProducto: productos.map((producto) => ({
      codigo: producto.codigo,
      nombre: producto.nombre,
      conteo: porProductoMap.get(producto.codigo)!,
    })),
  };
}
