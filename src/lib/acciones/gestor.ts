import "server-only";
import type { z } from "zod";
import { ipDeLaSolicitud } from "@/lib/auditoria";
import { obtenerContextoUsuario } from "@/lib/contexto-usuario";
import type { ResultadoAccion } from "@/lib/validaciones/usuario";

/**
 * Piezas compartidas por las server actions del Gestor (Prospección, Email y
 * Llamadas). Viven acá para que las tres resuelvan la identidad y el alcance de
 * la misma forma: el rol se revalida en el servidor, nunca se confía en la UI.
 */

export type ContextoGestor = {
  gestorId: string;
  /** Identidad del operador ante los proveedores (Truora la exige al enviar). */
  email: string;
  companiaId: string;
  oficinaId: string | null;
  ip: string | null;
};

export const NO_AUTORIZADO: ResultadoAccion = {
  ok: false,
  mensaje: "No tienes permiso para realizar esta acción.",
};

export async function exigirGestor(): Promise<ContextoGestor | null> {
  const contexto = await obtenerContextoUsuario();
  if (!contexto) return null;
  if (contexto.rol.codigo !== "GESTOR") return null;
  if (!contexto.compania) return null;

  return {
    gestorId: contexto.usuario.id,
    email: contexto.usuario.email,
    companiaId: contexto.compania.id,
    oficinaId: contexto.oficina?.id ?? null,
    ip: await ipDeLaSolicitud(),
  };
}

/** Primer mensaje por campo, para pintar los errores junto a cada input. */
export function erroresDeZod(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = issue.path.join(".") || "general";
    errores[campo] ??= issue.message;
  }
  return errores;
}
