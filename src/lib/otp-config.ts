// RN-21 / CRM.docx §3.1: el código es válido por máximo 2 minutos.
// Vive aparte de `auth.ts` porque ese archivo es server-only y este valor
// también lo necesita el contador visual en el cliente.
export const OTP_EXPIRES_IN_SECONDS = 2 * 60;
