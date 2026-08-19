import { prisma } from "@/lib/prisma";
import type { UnidadMedida } from "@/lib/formato";

/**
 * Detalle de una prospección y la historia de gestiones del asociado
 * (CRM.docx §7.3).
 *
 * El alcance sigue siendo el del propio Gestor: toda consulta lleva
 * `companiaId` y `gestorId`, así que una oportunidad de otro gestor de la misma
 * compañía no se puede abrir ni con el id en la URL. Sin RLS, ese filtro es la
 * única barrera.
 */

export type EtapaProspeccion = "CONTACTO" | "OFERTA" | "CIERRE";
export type ResultadoCierre = "VENTA" | "NO_VENTA";

export type DetalleProspeccion = {
  oportunidadId: string;
  asociadoId: string;
  asociadoNombre: string;
  asociadoIdentificacion: string;
  asociadoTelefono: string | null;
  oficinaNombre: string;
  productoCodigo: string;
  productoNombre: string;
  unidadMedida: UnidadMedida;
  /** Cantidad o monto según el producto. Se diligencia al pasar a oferta. */
  valor: number | null;
  etapa: EtapaProspeccion;
  resultadoCierre: ResultadoCierre | null;
  fechaApertura: Date;
  ultimaGestion: Date | null;
  /** RN-38: al cerrar, la prospección es de solo lectura. */
  cerrada: boolean;
};

export async function obtenerDetalle({
  companiaId,
  gestorId,
  oportunidadId,
}: {
  companiaId: string;
  gestorId: string;
  oportunidadId: string;
}): Promise<DetalleProspeccion | null> {
  const fila = await prisma.oportunidad.findFirst({
    where: { id: oportunidadId, companiaId, gestorId },
    select: {
      id: true,
      asociadoId: true,
      productoCodigo: true,
      cantidad: true,
      monto: true,
      etapa: true,
      estado: true,
      resultadoCierre: true,
      fechaApertura: true,
      fechaUltimaGestion: true,
      asociado: {
        select: {
          nombreCompleto: true,
          numeroIdentificacion: true,
          telefonoWhatsapp: true,
        },
      },
      oficina: { select: { nombre: true } },
      producto: { select: { nombre: true, unidadMedida: true } },
    },
  });

  if (!fila) return null;

  const unidadMedida = fila.producto.unidadMedida as UnidadMedida;
  const bruto = unidadMedida === "MONTO" ? fila.monto : fila.cantidad;

  return {
    oportunidadId: fila.id,
    asociadoId: fila.asociadoId,
    asociadoNombre: fila.asociado.nombreCompleto,
    asociadoIdentificacion: fila.asociado.numeroIdentificacion,
    asociadoTelefono: fila.asociado.telefonoWhatsapp,
    oficinaNombre: fila.oficina.nombre,
    productoCodigo: fila.productoCodigo,
    productoNombre: fila.producto.nombre,
    unidadMedida,
    valor: bruto == null ? null : Number(bruto),
    etapa: fila.etapa,
    resultadoCierre: fila.resultadoCierre,
    fechaApertura: fila.fechaApertura,
    ultimaGestion: fila.fechaUltimaGestion,
    // Se usa la etapa y no el estado: las 2 filas de INC-04 traen estado
    // PROSPECCION con etapa CIERRE, y una cerrada no debe poder editarse por
    // una incoherencia del cargue.
    cerrada: fila.etapa === "CIERRE" || fila.estado === "CERRADO",
  };
}

export type ItemHistorial = {
  id: string;
  fechaHora: Date;
  etapa: EtapaProspeccion;
  canalNombre: string | null;
  /** Colorea el badge del canal: WhatsApp, correo y llamada se distinguen por color. */
  medio: "WHATSAPP" | "EMAIL" | "TELEFONO" | null;
  productoNombre: string;
  observacion: string | null;
  /** Falso cuando la gestión viene de otra prospección del mismo asociado. */
  deEstaProspeccion: boolean;
};

/**
 * Historia completa de gestiones del asociado, no solo de esta prospección:
 * CRM.docx §7.3 pide que "el sistema traerá toda la historia de las gestiones
 * de ese cliente". Por eso cada fila dice de qué producto viene.
 *
 * El asociado está en la cartera del gestor (RN-32), así que ver su historia
 * completa está dentro de su alcance; de todos modos se filtra por compañía.
 */
export async function obtenerHistorialAsociado({
  companiaId,
  asociadoId,
  oportunidadId,
}: {
  companiaId: string;
  asociadoId: string;
  /** Para marcar qué gestiones son de la prospección abierta en pantalla. */
  oportunidadId: string;
}): Promise<ItemHistorial[]> {
  const filas = await prisma.gestion.findMany({
    where: { companiaId, asociadoId },
    select: {
      id: true,
      fechaHora: true,
      etapa: true,
      observacion: true,
      oportunidadId: true,
      canal: { select: { nombre: true, medio: true } },
      oportunidad: { select: { producto: { select: { nombre: true } } } },
    },
    orderBy: { fechaHora: "desc" },
  });

  return filas.map((fila) => ({
    id: fila.id,
    fechaHora: fila.fechaHora,
    etapa: fila.etapa,
    // Nulo cuando la gestión fue por fuera de los canales integrados.
    canalNombre: fila.canal?.nombre ?? null,
    medio: fila.canal?.medio ?? null,
    productoNombre: fila.oportunidad.producto.nombre,
    observacion: fila.observacion,
    deEstaProspeccion: fila.oportunidadId === oportunidadId,
  }));
}

export type CanalDelGestor = {
  codigo: string;
  nombre: string;
  habilitado: boolean;
};

/**
 * Los cuatro canales del catálogo con su estado para este gestor.
 *
 * A diferencia del formulario de alta, que solo ofrece los habilitados, el
 * detalle los muestra todos: la banda dice "canales habilitados por el
 * administrador de compañía", y para que eso se entienda hay que ver también
 * cuál quedó fuera.
 */
export async function obtenerCanalesDelGestor(
  gestorId: string,
): Promise<CanalDelGestor[]> {
  const canales = await prisma.canalComunicacion.findMany({
    select: {
      codigo: true,
      nombre: true,
      usuarioCanales: {
        where: { usuarioId: gestorId },
        select: { habilitado: true },
      },
    },
    orderBy: { orden: "asc" },
  });

  return canales.map((canal) => ({
    codigo: canal.codigo,
    nombre: canal.nombre,
    // Sin fila en usuario_canal el canal no está habilitado (RN-17).
    habilitado: canal.usuarioCanales[0]?.habilitado ?? false,
  }));
}
