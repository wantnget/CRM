import { z } from "zod";

/**
 * Validación del alta de una prospección (CRM.docx §7.3).
 *
 * Reglas del spec que se hacen cumplir acá y en la action:
 * - RN-32: el Gestor solo prospecta asociados que le hayan sido asignados.
 * - RN-36: la prospección arranca siempre en CONTACTO; las etapas no se saltan.
 * - RN-40: no puede haber dos oportunidades abiertas para la misma pareja
 *   asociado + producto.
 * - RN-17 / RN-18 / RN-44: el canal tiene que estar habilitado para el gestor,
 *   y el backend lo revalida en vez de confiar en el formulario.
 * - RN-46: el alta crea también la primera gestión en etapa CONTACTO, así la
 *   oportunidad nace en condiciones de avanzar a OFERTA.
 */

const uuid = z.string().uuid("Selección inválida");

export const esquemaNuevaProspeccion = z.object({
  asociadoId: uuid.describe("Asociado asignado al gestor"),
  productoCodigo: z
    .string()
    .trim()
    .min(1, "Selecciona un producto")
    .max(30),
  canalCodigo: z
    .string()
    .trim()
    .min(1, "Selecciona el canal del primer contacto")
    .max(30),
  /** Nota opcional de ese primer contacto. */
  observacion: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type EntradaNuevaProspeccion = z.infer<typeof esquemaNuevaProspeccion>;

/** Filtros de la bandeja. Viajan por URL para que el enlace sea compartible. */
export const FILTROS_BANDEJA = ["curso", "cerradas", "todas"] as const;
export type FiltroBandeja = (typeof FILTROS_BANDEJA)[number];

export function esFiltroBandeja(
  valor: string | undefined,
): valor is FiltroBandeja {
  return (FILTROS_BANDEJA as readonly string[]).includes(valor ?? "");
}
