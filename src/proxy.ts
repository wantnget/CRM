import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const AUTH_PAGE = "/crm/wantget/v1/sign-in";
const DEFAULT_REDIRECT = "/crm/wantget/v1/home";
const PROTECTED_ROUTES = ["/crm/wantget/v1/home"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth.api.getSession({ headers: request.headers });

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtectedRoute && !session) {
    const loginUrl = new URL(AUTH_PAGE, request.url);
    loginUrl.searchParams.set("callbackURL", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === AUTH_PAGE && session) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/crm/wantget/v1/home/:path*", "/crm/wantget/v1/sign-in"],
};
