import { prisma } from "@/lib/prisma";
import { inicialesDe } from "@/lib/formato";

export type ContactoLlamada = {
  oportunidadId: string;
  asociadoNombre: string;
  asociadoTelefono: string;
  iniciales: string;
  productoNombre: string;
};

export type LlamadaRegistrada = {
  id: string;
  oportunidadId: string;
  asociadoNombre: string;
  iniciales: string;
  productoNombre: string;
  fechaHora: Date;
  observacion: string | null;
};

/** Asociados de la cartera del gestor con prospección abierta y teléfono. */
export async function obtenerContactosLlamada({
  companiaId,
  gestorId,
}: {
  companiaId: string;
  gestorId: string;
}): Promise<ContactoLlamada[]> {
  const oportunidades = await prisma.oportunidad.findMany({
    where: {
      companiaId,
      gestorId,
      estado: "PROSPECCION",
      asociado: { telefonoWhatsapp: { not: null } },
    },
    select: {
      id: true,
      asociado: { select: { nombreCompleto: true, telefonoWhatsapp: true } },
      producto: { select: { nombre: true } },
    },
    orderBy: { asociado: { nombreCompleto: "asc" } },
  });

  return oportunidades.map((o) => ({
    oportunidadId: o.id,
    asociadoNombre: o.asociado.nombreCompleto,
    asociadoTelefono: o.asociado.telefonoWhatsapp!,
    iniciales: inicialesDe(o.asociado.nombreCompleto),
    productoNombre: o.producto.nombre,
  }));
}

/** Llamadas ya registradas por el gestor, más recientes primero. */
export async function obtenerHistorialLlamadas({
  companiaId,
  gestorId,
}: {
  companiaId: string;
  gestorId: string;
}): Promise<LlamadaRegistrada[]> {
  const gestiones = await prisma.gestion.findMany({
    where: {
      companiaId,
      gestorId,
      canal: { medio: "TELEFONO" },
      eliminadoAt: null,
    },
    select: {
      id: true,
      oportunidadId: true,
      fechaHora: true,
      observacion: true,
      asociado: { select: { nombreCompleto: true } },
      oportunidad: { select: { producto: { select: { nombre: true } } } },
    },
    orderBy: { fechaHora: "desc" },
    take: 100,
  });

  return gestiones.map((g) => ({
    id: g.id,
    oportunidadId: g.oportunidadId,
    asociadoNombre: g.asociado.nombreCompleto,
    iniciales: inicialesDe(g.asociado.nombreCompleto),
    productoNombre: g.oportunidad.producto.nombre,
    fechaHora: g.fechaHora,
    observacion: g.observacion,
  }));
}
