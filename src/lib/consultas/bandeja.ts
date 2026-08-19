import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { UnidadMedida } from "@/lib/formato";
import type { FiltroBandeja } from "@/lib/validaciones/prospeccion";

/**
 * Bandeja de prospección del Gestor (CRM.docx §7.3).
 *
 * Es una cola de trabajo, no un reporte: no se filtra por periodo, porque una
 * oportunidad abierta el mes pasado sigue en juego. La consecuencia es que
 * "Cerradas" crece sin techo, así que en algún momento pedirá paginación.
 *
 * El alcance es el del propio gestor (`gestor_id = usuario_actual` más
 * `compania_id`), que es lo que dice la matriz de visibilidad del spec. Sin RLS,
 * ese filtro es la única barrera.
 */

/** Estado que se muestra en la píldora de cada ítem. */
export type EstadoItem = "CONTACTO" | "OFERTA" | "VENTA" | "NO_VENTA";

export type ItemBandeja = {
  oportunidadId: string;
  asociadoNombre: string;
  asociadoIdentificacion: string;
  oficinaNombre: string;
  productoNombre: string;
  unidadMedida: UnidadMedida;
  /** Cantidad o monto según el producto. `null` mientras no se haya diligenciado. */
  valor: number | null;
  estado: EstadoItem;
  ultimaGestion: Date | null;
};

export type Bandeja = {
  items: ItemBandeja[];
  /** Total sin aplicar el filtro ni la búsqueda, para el "7 de 14". */
  total: number;
};

function estadoDe(
  etapa: string,
  resultadoCierre: string | null,
): EstadoItem {
  if (etapa === "CONTACTO") return "CONTACTO";
  if (etapa === "OFERTA") return "OFERTA";
  return resultadoCierre === "VENTA" ? "VENTA" : "NO_VENTA";
}

/**
 * El filtro se aplica sobre `etapa` y no sobre `estado`, para que las 2 filas
 * incoherentes que documenta INC-04 (estado PROSPECCION con etapa CIERRE) caigan
 * donde corresponde según su etapa, igual que en el embudo.
 */
function filtroEtapa(filtro: FiltroBandeja): Prisma.OportunidadWhereInput {
  if (filtro === "curso") return { etapa: { in: ["CONTACTO", "OFERTA"] } };
  if (filtro === "cerradas") return { etapa: "CIERRE" };
  return {};
}

export async function obtenerBandeja({
  companiaId,
  gestorId,
  filtro,
  busqueda,
}: {
  companiaId: string;
  gestorId: string;
  filtro: FiltroBandeja;
  busqueda: string;
}): Promise<Bandeja> {
  const alcance = { companiaId, gestorId };

  const termino = busqueda.trim();

  // Busca por nombre sin distinguir mayúsculas ni por identificación, que es lo
  // que ofrece el campo: "Buscar asociado o ID".
  const filtroBusqueda: Prisma.OportunidadWhereInput = termino
    ? {
        asociado: {
          OR: [
            { nombreCompleto: { contains: termino, mode: "insensitive" } },
            { numeroIdentificacion: { contains: termino } },
          ],
        },
      }
    : {};

  const [filas, total] = await Promise.all([
    prisma.oportunidad.findMany({
      where: { ...alcance, ...filtroEtapa(filtro), ...filtroBusqueda },
      select: {
        id: true,
        cantidad: true,
        monto: true,
        etapa: true,
        resultadoCierre: true,
        fechaUltimaGestion: true,
        fechaApertura: true,
        asociado: { select: { nombreCompleto: true, numeroIdentificacion: true } },
        oficina: { select: { nombre: true } },
        producto: { select: { nombre: true, unidadMedida: true } },
      },
      // Cola de trabajo: lo que se movió hace menos, primero. Las que no tienen
      // gestión registrada caen al final del bloque por la fecha de apertura.
      orderBy: [{ fechaUltimaGestion: "desc" }, { fechaApertura: "desc" }],
    }),

    prisma.oportunidad.count({ where: alcance }),
  ]);

  return {
    total,
    items: filas.map((fila) => {
      const esMonto = fila.producto.unidadMedida === "MONTO";
      const bruto = esMonto ? fila.monto : fila.cantidad;

      return {
        oportunidadId: fila.id,
        asociadoNombre: fila.asociado.nombreCompleto,
        asociadoIdentificacion: fila.asociado.numeroIdentificacion,
        oficinaNombre: fila.oficina.nombre,
        productoNombre: fila.producto.nombre,
        unidadMedida: fila.producto.unidadMedida as UnidadMedida,
        valor: bruto == null ? null : Number(bruto),
        estado: estadoDe(fila.etapa, fila.resultadoCierre),
        ultimaGestion: fila.fechaUltimaGestion,
      };
    }),
  };
}

/**
 * Asociados que el gestor puede prospectar: los que su Líder le asignó y siguen
 * vigentes (RN-32). Alimenta el desplegable del formulario, así la regla se
 * cumple por construcción y no solo por validación.
 */
export async function obtenerAsociadosAsignados({
  companiaId,
  gestorId,
}: {
  companiaId: string;
  gestorId: string;
}) {
  const asignaciones = await prisma.asignacionAsociado.findMany({
    where: {
      companiaId,
      gestorId,
      vigente: true,
      asociado: { estado: "ACTIVO" },
    },
    select: {
      asociado: {
        select: { id: true, nombreCompleto: true, numeroIdentificacion: true },
      },
    },
    orderBy: { asociado: { nombreCompleto: "asc" } },
  });

  return asignaciones.map((a) => a.asociado);
}

/** Canales habilitados para el gestor (RN-17). */
export async function obtenerCanalesHabilitados(gestorId: string) {
  const canales = await prisma.usuarioCanal.findMany({
    where: { usuarioId: gestorId, habilitado: true },
    select: { canalCodigo: true, canal: { select: { nombre: true, orden: true } } },
    orderBy: { canal: { orden: "asc" } },
  });

  return canales.map((c) => ({ codigo: c.canalCodigo, nombre: c.canal.nombre }));
}

/** Productos activos, para el desplegable del formulario (RN-53). */
export async function obtenerProductosActivos() {
  return prisma.producto.findMany({
    where: { activo: true },
    select: { codigo: true, nombre: true },
    orderBy: { orden: "asc" },
  });
}
