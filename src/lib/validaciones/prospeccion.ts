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

/**
 * Registro de una gestión (CRM.docx §7.3).
 *
 * La etapa que se elige acá es la de la gestión, no la de la oportunidad: el
 * campo `gestion.etapa` del spec es "la etapa en la que se realizó esta
 * gestión". Mover la prospección de etapa es una acción aparte.
 */
export const ETAPAS = ["CONTACTO", "OFERTA", "CIERRE"] as const;
export type Etapa = (typeof ETAPAS)[number];

export const esquemaRegistrarGestion = z.object({
  oportunidadId: uuid,
  canalCodigo: z.string().trim().min(1, "Selecciona un canal").max(30),
  etapa: z.enum(ETAPAS),
  observacion: z
    .string()
    .trim()
    .min(1, "Describe el resultado de la interacción")
    .max(2000),
});

/**
 * Cambio de etapa de la prospección.
 *
 * Solo CONTACTO y OFERTA: a CIERRE se llega por el cierre, que además exige
 * resultado y es irreversible (RN-38).
 *
 * El valor es obligatorio al pasar a OFERTA, que es cuando se presentan
 * "condiciones, monto, plazo y beneficios", y opcional al volver a CONTACTO
 * porque ahí todavía no hay oferta que valorar.
 */
export const esquemaCambiarEtapa = z.object({
  oportunidadId: uuid,
  etapa: z.enum(["CONTACTO", "OFERTA"]),
  valor: z.number().positive("El valor debe ser mayor que cero").nullable(),
});

/**
 * Cierre de la prospección (RN-37).
 *
 * Con resultado VENTA el valor es obligatorio: es lo que suma al dashboard
 * (RN-39) y lo que exige ck_oportunidad_venta_con_valor. Se pide de nuevo
 * porque la negociación pudo cambiar lo ofertado.
 *
 * No lleva observación: el spec no define un campo de motivo del cierre. Si el
 * gestor quiere dejar una nota, registra una gestión antes de cerrar, que es
 * donde vive la bitácora.
 */
export const esquemaCerrarProspeccion = z
  .object({
    oportunidadId: uuid,
    resultado: z.enum(["VENTA", "NO_VENTA"]),
    valor: z.number().positive("El valor debe ser mayor que cero").nullable(),
  })
  .superRefine((datos, ctx) => {
    if (datos.resultado === "VENTA" && datos.valor === null) {
      ctx.addIssue({
        code: "custom",
        path: ["valor"],
        message: "Confirma el valor de la venta",
      });
    }
  });
