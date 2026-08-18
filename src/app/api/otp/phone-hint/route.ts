import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Enmascara el teléfono para la pantalla de verificación
 * (`codigo_verificacion.destino_enmascarado` del spec, calculado al vuelo).
 */
function maskPhone(phone: string) {
  if (phone.length <= 5) return phone;
  const start = phone.slice(0, 3);
  const end = phone.slice(-2);
  const masked = "*".repeat(phone.length - 5);
  return `${start}${masked}${end}`;
}

export async function POST(request: Request) {
  const { email } = await request.json();

  if (typeof email !== "string") {
    return NextResponse.json({ phone: null });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase() },
    select: { telefonoWhatsapp: true, estado: true },
  });

  // RN-11: un usuario inactivo no recibe código, así que tampoco se le muestra
  // destino. La respuesta es idéntica a "no existe" para no permitir enumerar.
  const puedeAutenticarse = usuario?.estado === "ACTIVO";

  return NextResponse.json({
    phone:
      puedeAutenticarse && usuario.telefonoWhatsapp
        ? maskPhone(usuario.telefonoWhatsapp)
        : null,
  });
}
