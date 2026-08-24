import { useSyncExternalStore } from "react";

/**
 * Borradores de correo del gestor. Viven en localStorage y no en la base: un
 * borrador todavía no es una gestión, y `gestion` es la bitácora de lo que ya
 * ocurrió (RN-43). Se guardan por gestor para que dos sesiones en el mismo
 * navegador no se mezclen los borradores.
 */
export type BorradorCorreo = {
  id: string;
  oportunidadId: string;
  asunto: string;
  cuerpo: string;
  guardadoEn: string;
};

function claveDe(gestorId: string): string {
  return `crm-correo-borradores-${gestorId}`;
}

function leer(gestorId: string): BorradorCorreo[] {
  const guardado = localStorage.getItem(claveDe(gestorId));
  return guardado ? JSON.parse(guardado) : [];
}

function escribir(gestorId: string, borradores: BorradorCorreo[]) {
  localStorage.setItem(claveDe(gestorId), JSON.stringify(borradores));
  for (const listener of listeners) listener();
}

const listeners = new Set<() => void>();

function suscribir(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function guardarBorrador(
  gestorId: string,
  borrador: Omit<BorradorCorreo, "guardadoEn">,
) {
  const otros = leer(gestorId).filter((b) => b.id !== borrador.id);
  escribir(gestorId, [
    { ...borrador, guardadoEn: new Date().toISOString() },
    ...otros,
  ]);
}

export function descartarBorrador(gestorId: string, id: string) {
  escribir(
    gestorId,
    leer(gestorId).filter((b) => b.id !== id),
  );
}

export function useBorradoresCorreo(gestorId: string): BorradorCorreo[] {
  const serializado = useSyncExternalStore(
    suscribir,
    () => localStorage.getItem(claveDe(gestorId)) ?? "[]",
    () => "[]",
  );
  return JSON.parse(serializado) as BorradorCorreo[];
}
