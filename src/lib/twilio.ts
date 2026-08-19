import "server-only";
import twilio from "twilio";


const API_BASE = "https://api.twilio.com/2010-04-01/Accounts";

export async function enviarWhatsApp(cuerpo: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.TWILIO_WHATSAPP_TEST_TO;

  if (!accountSid || !authToken || !from || !to) {
    throw new Error("Faltan variables de entorno de Twilio WhatsApp");
  }

  const credenciales = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const body = new URLSearchParams({
    To: `whatsapp:${to}`,
    From: `whatsapp:${from}`,
    Body: cuerpo,
  });

  console.log(`[CRM twilio] enviando WhatsApp de ${from} a ${to}`);

  const respuesta = await fetch(`${API_BASE}/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      authorization: `Basic ${credenciales}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  if (!respuesta.ok) {
    const texto = await respuesta.text();
    console.error(`[CRM twilio] WhatsApp falló (${respuesta.status}): ${texto}`);
    throw new Error(`Twilio WhatsApp send failed (${respuesta.status}): ${texto}`);
  }

  const resultado = (await respuesta.json()) as { sid: string; status: string };
  console.log(`[CRM twilio] WhatsApp enviado sid=${resultado.sid} status=${resultado.status}`);
  return resultado;
}

function identidadDe(email: string) {
  return email.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function crearTokenVoz(email: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid) {
    throw new Error("Faltan variables de entorno de Twilio Voz");
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
    identity: identidadDe(email),
    ttl: 3600,
  });

  token.addGrant(
    new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: false,
    }),
  );

  console.log(`[CRM twilio] token de voz generado para ${email}`);
  return token.toJwt();
}

export function twimlLlamada() {
  const callerId = process.env.TWILIO_CALLER_ID;
  const destino = process.env.TWILIO_CALL_TEST_TO;

  if (!callerId || !destino) {
    throw new Error("Faltan variables de entorno de Twilio Voz");
  }

  console.log(`[CRM twilio] TwiML de llamada: callerId=${callerId} destino=${destino}`);

  const response = new twilio.twiml.VoiceResponse();
  response.dial({ callerId, answerOnBridge: true }).number(destino);

  return response.toString();
}

export async function enviarCorreo({
  destinatario,
  asunto,
  cuerpo,
}: {
  destinatario: string;
  asunto: string;
  cuerpo: string;
}) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Faltan variables de entorno de SendGrid");
  }

  console.log(`[CRM twilio] enviando correo de ${from} a ${destinatario}`);

  const respuesta = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: destinatario }] }],
      from: { email: from },
      subject: asunto,
      content: [{ type: "text/plain", value: cuerpo }],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!respuesta.ok) {
    const texto = await respuesta.text();
    console.error(`[CRM twilio] correo falló (${respuesta.status}): ${texto}`);
    throw new Error(`SendGrid send failed (${respuesta.status}): ${texto}`);
  }

  // SendGrid responde 202 sin cuerpo; el id de rastreo va en el header.
  const messageId = respuesta.headers.get("x-message-id");
  console.log(`[CRM twilio] correo enviado x-message-id=${messageId}`);
  return { messageId };
}
