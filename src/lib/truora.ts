const TRUORA_COUNTRY_CODE = "+57";

export async function sendWhatsAppOTP(phone: string, code: string) {
  const response = await fetch(process.env.API_OUTPUT_TRUORA!, {
    method: "POST",
    headers: {
      "Truora-API-Key": process.env.API_KEY_TRUORA!,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      phone_number: phone,
      country_code: TRUORA_COUNTRY_CODE,
      outbound_id: process.env.TRUORA_OUTBOUND_ID!,
      flow_id: "",
      user_authorized: "true",
      preserve_last_outbound: "false",
      "var.code": code,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Truora WhatsApp send failed (${response.status}): ${body}`);
  }
}
