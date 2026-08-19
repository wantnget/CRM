/**
 * Envío del OTP por WhatsApp vía Truora (responde PA-12: el proveedor).
 *
 * El spec guarda `usuario.telefono_whatsapp` en formato E.164
 * ("+573001234567"), pero la API de Truora recibe el indicativo y el número
 * nacional por separado, así que aquí se parte.
 */

const INDICATIVO_POR_DEFECTO = "+57";

type TelefonoE164 = { countryCode: string; nationalNumber: string };

/**
 * Parte un teléfono E.164 en indicativo + número nacional. Acepta números sin
 * indicativo (asume Colombia) para tolerar datos cargados sin normalizar.
 */
export function partirTelefonoE164(telefono: string): TelefonoE164 {
  const limpio = telefono.replace(/[\s()-]/g, "");

  if (limpio.startsWith("+57")) {
    return { countryCode: "+57", nationalNumber: limpio.slice(3) };
  }

  if (limpio.startsWith("+")) {
    // Indicativo desconocido: se toman los primeros 1-3 dígitos como país.
    const match = /^\+(\d{1,3})(\d+)$/.exec(limpio);
    if (match) {
      return { countryCode: `+${match[1]}`, nationalNumber: match[2] };
    }
  }

  return { countryCode: INDICATIVO_POR_DEFECTO, nationalNumber: limpio };
}

export async function sendWhatsAppOTP(telefono: string, code: string) {
  const { countryCode, nationalNumber } = partirTelefonoE164(telefono);

  const response = await fetch(process.env.API_OUTPUT_TRUORA!, {
    method: "POST",
    headers: {
      "Truora-API-Key": process.env.API_KEY_TRUORA!,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      phone_number: nationalNumber,
      country_code: countryCode,
      outbound_id: process.env.TRUORA_OUTBOUND_ID!,
      flow_id: "",
      user_authorized: "true",
      preserve_last_outbound: "false",
      "var.code": code,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    // RN-26: el código no debe quedar en logs. Solo se registra el estado.
    throw new Error(`Truora WhatsApp send failed (${response.status}): ${body}`);
  }
}
