import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins/email-otp";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppOTP } from "@/lib/truora";

const ONE_HOUR_IN_SECONDS = 60 * 60;
const OTP_EXPIRES_IN_SECONDS = 2 * 60;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: false,
  },
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  session: {
    expiresIn: ONE_HOUR_IN_SECONDS,
    disableSessionRefresh: true,
    cookieCache: {
      enabled: true,
      maxAge: ONE_HOUR_IN_SECONDS,
      strategy: "jwt",
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: OTP_EXPIRES_IN_SECONDS,
      disableSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== "sign-in") return;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.phone) return;

        await sendWhatsAppOTP(user.phone, otp);
      },
    }),
    nextCookies(),
  ],
});
