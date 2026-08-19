import { prisma } from "@/lib/prisma";
import type { FiltroConsulta } from "@/lib/consulta-general";

export type FilaMeta = {
  gestorId: string;
  gestor: string;
  lider: string;
  periodo: string;
  vigente: boolean;
  valores: Record<string, number | null>;
};

/**
 * Trae las metas de todos los periodos (no solo el vigente): el orden es lo
 * que distingue "vigente" del resto, no un filtro — así se puede auditar lo
 * que traía el cargue anterior sin perder de vista qué manda hoy.
 */
export async function metasVigentes(
  companiaId: string,
  filtro: FiltroConsulta,
  periodoVigente: string,
): Promise<FilaMeta[]> {
  const gestores = await prisma.usuario.findMany({
    where: {
      companiaId,
      rolCodigo: "GESTOR",
      estado: "ACTIVO",
      ...(filtro.gestorId ? { id: filtro.gestorId } : {}),
      ...(filtro.liderId
        ? { comoGestorAsignaciones: { some: { liderId: filtro.liderId, vigenteHasta: null } } }
        : {}),
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      comoGestorAsignaciones: {
        where: { vigenteHasta: null },
        select: { lider: { select: { nombres: true, apellidos: true } } },
        take: 1,
      },
      metasPropias: {
        select: { periodo: true, productoCodigo: true, metaCantidad: true, metaMonto: true },
      },
    },
    orderBy: { nombres: "asc" },
  });

  const filas: FilaMeta[] = [];

  for (const gestor of gestores) {
    const nombreGestor = `${gestor.nombres} ${gestor.apellidos}`;
    const nombreLider = gestor.comoGestorAsignaciones[0]
      ? `${gestor.comoGestorAsignaciones[0].lider.nombres} ${gestor.comoGestorAsignaciones[0].lider.apellidos}`
      : "—";

    const valoresPorPeriodo = new Map<string, Record<string, number | null>>();
    for (const meta of gestor.metasPropias) {
      const valores = valoresPorPeriodo.get(meta.periodo) ?? {};
      valores[meta.productoCodigo] = meta.metaCantidad ?? (meta.metaMonto ? Number(meta.metaMonto) : null);
      valoresPorPeriodo.set(meta.periodo, valores);
    }

    for (const [periodo, valores] of valoresPorPeriodo) {
      filas.push({
        gestorId: gestor.id,
        gestor: nombreGestor,
        lider: nombreLider,
        periodo,
        vigente: periodo === periodoVigente,
        valores,
      });
    }
  }

  // El vigente siempre primero; entre el resto, el más reciente primero.
  filas.sort((a, b) => {
    if (a.vigente !== b.vigente) return a.vigente ? -1 : 1;
    if (a.periodo !== b.periodo) return b.periodo.localeCompare(a.periodo);
    return a.gestor.localeCompare(b.gestor);
  });

  return filas;
}

export type ResumenCargue = {
  ultimoCargue: Date | null;
  registrosVigentes: number;
};

export async function resumenCargueMetas(
  companiaId: string,
  periodo: string,
): Promise<ResumenCargue> {
  const [ultimoCargue, registrosVigentes] = await Promise.all([
    prisma.cargueArchivo.findFirst({
      where: { companiaId, tipo: "METAS" },
      orderBy: { iniciadoAt: "desc" },
      select: { finalizadoAt: true, iniciadoAt: true },
    }),
    prisma.meta.count({ where: { companiaId, periodo } }),
  ]);

  return {
    ultimoCargue: ultimoCargue?.finalizadoAt ?? ultimoCargue?.iniciadoAt ?? null,
    registrosVigentes,
  };
}

export async function productosActivos() {
  return prisma.producto.findMany({ where: { activo: true }, orderBy: { orden: "asc" } });
}
