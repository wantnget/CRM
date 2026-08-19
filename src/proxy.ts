import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  BASE_CRM,
  esRolConocido,
  puedeAcceder,
  rutaInicial,
} from "@/lib/navegacion";

const AUTH_PAGE = `${BASE_CRM}/sign-in`;
const HOME = `${BASE_CRM}/home`;

/**
 * `/home` queda fuera de la lista de rutas con control de rol: no tiene
 * contenido propio, solo reenvía al primer módulo del rol (o muestra el estado
 * "sin módulos" del rol CONSULTA).
 */
const RUTAS_SIN_CONTROL_DE_ROL = [HOME];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth.api.getSession({ headers: request.headers });

  if (pathname === AUTH_PAGE) {
    if (session) return NextResponse.redirect(new URL(HOME, request.url));
    return NextResponse.next();
  }

  // Todo lo demás que hace match con el matcher es zona autenticada.
  if (!session) {
    const loginUrl = new URL(AUTH_PAGE, request.url);
    loginUrl.searchParams.set("callbackURL", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (RUTAS_SIN_CONTROL_DE_ROL.includes(pathname)) {
    return NextResponse.next();
  }

  // El rol viaja en el cookie cache de better-auth, así que autorizar acá no
  // cuesta una consulta. Cada page lo revalida de todos modos.
  const rol = session.user.rolCodigo;

  if (!esRolConocido(rol)) {
    return NextResponse.redirect(new URL(HOME, request.url));
  }

  if (!puedeAcceder(rol, pathname)) {
    return NextResponse.redirect(new URL(rutaInicial(rol) ?? HOME, request.url));
  }

  return NextResponse.next();
}

/**
 * Cubre todas las rutas de la aplicación autenticada. Las de fase 2 no se
 * listan porque no existen como page: Next responde 404 y además
 * `puedeAcceder` las rechaza.
 */
export const config = {
  // Next exige que el matcher sea estaticamente analizable, asi que va literal
  // y no interpolado desde BASE_CRM. Si se agrega un modulo a lib/navegacion.ts
  // hay que agregarlo aca tambien.
  matcher: [
    "/crm/wantget/v1/sign-in",
    "/crm/wantget/v1/home/:path*",
    "/crm/wantget/v1/companias/:path*",
    "/crm/wantget/v1/usuarios/:path*",
    "/crm/wantget/v1/consulta/:path*",
    "/crm/wantget/v1/metas/:path*",
    "/crm/wantget/v1/prospeccion/:path*",
  ],
};
