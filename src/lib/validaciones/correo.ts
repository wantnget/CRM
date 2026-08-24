import { z } from "zod";

export const esquemaEnviarCorreo = z.object({
  oportunidadId: z.string().uuid("Selección inválida"),
  asunto: z.string().trim().min(1, "El asunto es obligatorio").max(200),
  cuerpo: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje antes de enviar")
    .max(5000),
});

export type EntradaEnviarCorreo = z.infer<typeof esquemaEnviarCorreo>;

export const esquemaEliminarCorreo = z.object({
  gestionId: z.string().uuid("Selección inválida"),
});
