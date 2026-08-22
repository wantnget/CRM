import { z } from "zod";

export const esquemaAbrirConversacion = z.object({
  asociadoId: z.string().uuid("Selección inválida"),
});

export const esquemaEnviarMensaje = z.object({
  conversacionId: z.string().uuid("Selección inválida"),
  cuerpo: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje antes de enviar")
    .max(4096),
});

export const esquemaEliminarConversacion = z.object({
  conversacionId: z.string().uuid("Selección inválida"),
});

export type EntradaEnviarMensaje = z.infer<typeof esquemaEnviarMensaje>;
