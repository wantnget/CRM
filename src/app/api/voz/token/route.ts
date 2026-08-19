import { NextResponse } from "next/server";
import { obtenerContextoUsuario } from "@/lib/contexto-usuario";
import { crearTokenVoz } from "@/lib/twilio";

/**
 * Emite el Access Token que el softphone del navegador usa para registrarse
 * (canal Llamada). Solo el Gestor autenticado puede pedir su propio token.
 */
export async function GET() {
  const contexto = await obtenerContextoUsuario();
  if (!contexto || contexto.rol.codigo !== "GESTOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const token = crearTokenVoz(contexto.usuario.email);
    return NextResponse.json({ token });
  } catch (error) {
    console.error("[voz/token]", error);
    return NextResponse.json(
      { error: "No se pudo generar el token de voz" },
      { status: 500 },
    );
  }
}
