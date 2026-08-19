import { redirect } from "next/navigation";
import {
  BASE_CRM,
  puedeAcceder,
  rutaInicial,
  type RolCodigo,
} from "@/lib/navegacion";
import {
  obtenerContextoUsuario,
  type ContextoUsuario,
} from "@/lib/contexto-usuario";

export const RUTA_SIGN_IN = `${BASE_CRM}/sign-in`;
export const RUTA_HOME = `${BASE_CRM}/home`;

/**
 * Guard de página. Se ejecuta en el server component de cada módulo, además de
 * la validación del proxy: el spec exige que el control de alcance por rol
 * exista en la capa de API y no solo en la UI.
 *
 * Si el rol no tiene permiso lo devuelve a su propio módulo inicial en vez de
 * mostrarle un error, que es lo que espera alguien que llegó por un enlace
 * viejo o escribiendo la URL.
 */
export async function exigirAcceso(pathname: string): Promise<ContextoUsuario> {
  const contexto = await obtenerContextoUsuario();

  if (!contexto) {
    redirect(`${RUTA_SIGN_IN}?callbackURL=${encodeURIComponent(pathname)}`);
  }

  if (!puedeAcceder(contexto.rol.codigo, pathname)) {
    const destino = rutaInicial(contexto.rol.codigo);
    redirect(destino ?? RUTA_HOME);
  }

  return contexto;
}

/** Contexto de un usuario autenticado, sin comprobar ruta. Para /home. */
export async function exigirSesion(): Promise<ContextoUsuario> {
  const contexto = await obtenerContextoUsuario();
  if (!contexto) redirect(RUTA_SIGN_IN);
  return contexto;
}

export type { RolCodigo };
