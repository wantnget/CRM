import { NextResponse } from "next/server";
import { twimlLlamada } from "@/lib/twilio";

/**
 * Webhook que Twilio invoca cuando el softphone hace `device.connect()` (la
 * TwiML Application configurada en TWILIO_TWIML_APP_SID apunta acá). No lleva
 * sesión de la app: Twilio es quien llama a esta ruta, no el navegador del
 * gestor.
 *
 * El número real del asociado viaja como parámetro custom de `connect()`
 * (`params: { To: ... }`), y Twilio lo reenvía acá como campo del form-urlencoded.
 */
export async function POST(request: Request) {
  const datos = await request.formData();
  const destino = datos.get("To");

  if (typeof destino !== "string" || !destino) {
    return new NextResponse("Falta el parámetro To", { status: 400 });
  }

  const twiml = twimlLlamada(destino);

  return new NextResponse(twiml, {
    headers: { "content-type": "text/xml" },
  });
}
