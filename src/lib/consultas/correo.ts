import { prisma } from "@/lib/prisma";
import { inicialesDe } from "@/lib/formato";
import type { DireccionComunicacion } from "@/generated/prisma/enums";

export type Correo = {
  id: string;
  oportunidadId: string;
  remitente: string;
  correoRemitente: string;
  iniciales: string;
  asunto: string;
  extracto: string;
  cuerpo: string;
  fechaHora: Date;
  direccion: DireccionComunicacion;
  eliminado: boolean;
};

function extractoDe(texto: string, limite = 140): string {
  const plano = texto.replace(/\s+/g, " ").trim();
  return plano.length > limite ? `${plano.slice(0, limite)}…` : plano;
}

export async function obtenerCorreos({
  companiaId,
  gestorId,
}: {
  companiaId: string;
  gestorId: string;
}): Promise<Correo[]> {
  const gestiones = await prisma.gestion.findMany({
    where: { companiaId, gestorId, canal: { medio: "EMAIL" } },
    select: {
      id: true,
      oportunidadId: true,
      fechaHora: true,
      direccion: true,
      asunto: true,
      observacion: true,
      eliminadoAt: true,
      asociado: { select: { nombreCompleto: true, email: true } },
      oportunidad: { select: { producto: { select: { nombre: true } } } },
    },
    orderBy: { fechaHora: "desc" },
  });

  return gestiones
    .filter((g) => g.asociado.email)
    .map((g) => {
      const cuerpo = g.observacion ?? "";
      return {
        id: g.id,
        oportunidadId: g.oportunidadId,
        remitente: g.asociado.nombreCompleto,
        correoRemitente: g.asociado.email!,
        iniciales: inicialesDe(g.asociado.nombreCompleto),
        asunto: g.asunto ?? g.oportunidad.producto.nombre,
        extracto: extractoDe(cuerpo),
        cuerpo,
        fechaHora: g.fechaHora,
        direccion: g.direccion ?? "SALIDA",
        eliminado: g.eliminadoAt !== null,
      };
    });
}

export type DestinatarioCorreo = {
  oportunidadId: string;
  asociadoNombre: string;
  asociadoEmail: string;
  productoNombre: string;
};

export async function obtenerDestinatariosCorreo({
  companiaId,
  gestorId,
}: {
  companiaId: string;
  gestorId: string;
}): Promise<DestinatarioCorreo[]> {
  const oportunidades = await prisma.oportunidad.findMany({
    where: {
      companiaId,
      gestorId,
      estado: "PROSPECCION",
      asociado: { email: { not: null } },
    },
    select: {
      id: true,
      asociado: { select: { nombreCompleto: true, email: true } },
      producto: { select: { nombre: true } },
    },
    orderBy: { asociado: { nombreCompleto: "asc" } },
  });

  return oportunidades.map((o) => ({
    oportunidadId: o.id,
    asociadoNombre: o.asociado.nombreCompleto,
    asociadoEmail: o.asociado.email!,
    productoNombre: o.producto.nombre,
  }));
}
