import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins/email-otp";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppOTP } from "@/lib/truora";
import { proximoCierreProgramado } from "@/lib/sesion";

// RN-21 / CRM.docx §3.1: el código es válido por máximo 2 minutos.
const OTP_EXPIRES_IN_SECONDS = 2 * 60;

// RN-25: máximo 5 intentos fallidos por código.
const OTP_ALLOWED_ATTEMPTS = 5;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: false,
  },
  advanced: {
    database: {
      // usuario.id, session.id y verification.id son columnas uuid.
      generateId: "uuid",
    },
  },
  // El modelo `user` de better-auth ES la tabla de negocio `usuario`. Las
  // claves de `fields` y `modelName` son nombres de Prisma, no columnas SQL.
  user: {
    modelName: "usuario",
    fields: {
      name: "nombres",
    },
    additionalFields: {
      // Deben declararse para que lleguen a la sesión: parseUserOutput filtra
      // todo campo no declarado antes de exponer el usuario al cliente.
      apellidos: { type: "string", required: true, input: false },
      telefonoWhatsapp: { type: "string", required: true, input: false },
      rolCodigo: { type: "string", required: true, input: false },
      companiaId: { type: "string", required: false, input: false },
      oficinaId: { type: "string", required: false, input: false },
      estado: { type: "string", required: true, input: false },
    },
  },
  session: {
    // La ventana de sesión no es una duración fija: se cierra a la hora diaria
    // de la compañía. `expiresIn` queda como techo de seguridad y el valor real
    // lo fija el hook session.create.before.
    expiresIn: 24 * 60 * 60,
    disableSessionRefresh: true,
    additionalFields: {
      companiaId: { type: "string", required: false, input: false },
      tipoCierre: { type: "string", required: false, input: false },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const usuario = await prisma.usuario.findUnique({
            where: { id: session.userId },
            select: {
              estado: true,
              companiaId: true,
              compania: { select: { horaCierreSesion: true, estado: true } },
            },
          });

          // RN-11: un usuario INACTIVO no puede autenticarse. Devolver false
          // aborta la creación de la sesión.
          if (!usuario || usuario.estado !== "ACTIVO") return false;
          if (usuario.compania && usuario.compania.estado !== "ACTIVO") {
            return false;
          }

          return {
            data: {
              ...session,
              companiaId: usuario.companiaId,
              // RN-28 / PA-04: cierre automático a la hora diaria de la
              // compañía. ADMIN_GENERAL no tiene compañía; usa el default.
              expiresAt: proximoCierreProgramado(
                usuario.compania?.horaCierreSesion,
              ),
            },
          };
        },
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: OTP_EXPIRES_IN_SECONDS,
      allowedAttempts: OTP_ALLOWED_ATTEMPTS,
      // El spec exige codigo_hash: "NUNCA almacenar el código en texto plano"
      // (RN-26). El default de better-auth es "plain".
      storeOTP: "hashed",
      // RN-07/08/09: los usuarios se crean por administración, nunca por
      // autoservicio. Sin esto better-auth insertaría filas en `usuario` sin
      // los campos de negocio obligatorios.
      disableSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== "sign-in") return;

        const usuario = await prisma.usuario.findUnique({
          where: { email: email.toLowerCase() },
          select: { telefonoWhatsapp: true, estado: true },
        });

        // RN-11: un usuario INACTIVO tampoco recibe código. Se sale en
        // silencio para no revelar si el correo existe.
        if (!usuario || usuario.estado !== "ACTIVO") return;

        await sendWhatsAppOTP(usuario.telefonoWhatsapp, otp);
      },
    }),
    nextCookies(),
  ],
});
