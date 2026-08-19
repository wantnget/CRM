import { NextResponse } from "next/server";
import { twimlLlamada } from "@/lib/twilio";

/**
 * Webhook que Twilio invoca cuando el softphone hace `device.connect()` (la
 * TwiML Application configurada en TWILIO_TWIML_APP_SID apunta acá). No lleva
 * sesión de la app: Twilio es quien llama a esta ruta, no el navegador del
 * gestor.
 */
export async function POST() {
  const twiml = twimlLlamada();

  return new NextResponse(twiml, {
    headers: { "content-type": "text/xml" },
  });
}
