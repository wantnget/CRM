import { z } from "zod";

export const esquemaRegistrarLlamada = z.object({
  oportunidadId: z.string().uuid("Selección inválida"),
  duracionSegundos: z.number().int().min(0).max(86_400),
  observacion: z
    .string()
    .trim()
    .min(1, "Describe el resultado de la llamada")
    .max(2000),
});

export type EntradaRegistrarLlamada = z.infer<typeof esquemaRegistrarLlamada>;
