import { z } from "zod";

export const emailSchema = z.object({
  email: z
    .email("Ingresa un correo electrónico válido")
    .min(1, "El correo es obligatorio"),
});

export type EmailInput = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .min(1, "El código es obligatorio")
    .length(6, "El código debe tener 6 dígitos"),
});

export type OtpInput = z.infer<typeof otpSchema>;
