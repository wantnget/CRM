import { z } from "zod";

/**
 * Validación del alta y edición de usuarios (CRM.docx §4.2).
 *
 * Las reglas del spec que se hacen cumplir acá:
 * - RN-07 / RN-08: la Administradora de Compañía solo maneja DIRECTOR, LIDER y
 *   GESTOR. ADMIN_COMPANIA lo crea el Administrador General, y ADMIN_GENERAL no
 *   se crea desde la aplicación (RN-09).
 * - ck_usuario_gestor_con_oficina: el GESTOR siempre tiene oficina.
 * - RN-13 / RN-14: el LIDER puede tener varias oficinas.
 * - INC-01: el teléfono de WhatsApp es obligatorio, en E.164. Sin él el usuario
 *   no puede autenticarse porque el OTP viaja por ese canal.
 */

/** Roles que puede asignar la Administradora de Compañía. */
export const ROLES_ASIGNABLES = ["DIRECTOR", "LIDER", "GESTOR"] as const;
export type RolAsignable = (typeof ROLES_ASIGNABLES)[number];

const email = z
  .string()
  .trim()
  .min(1, "El correo es obligatorio")
  .max(160, "Máximo 160 caracteres")
  .toLowerCase()
  .pipe(z.email("Ingresa un correo electrónico válido"));

const numeroIdentificacion = z
  .string()
  .trim()
  .min(5, "Mínimo 5 caracteres")
  .max(20, "Máximo 20 caracteres")
  .regex(/^[0-9A-Za-z-]+$/, "Solo números y letras");

const nombres = z
  .string()
  .trim()
  .min(1, "Los nombres son obligatorios")
  .max(100, "Máximo 100 caracteres");

const apellidos = z
  .string()
  .trim()
  .min(1, "Los apellidos son obligatorios")
  .max(100, "Máximo 100 caracteres");

// E.164: "+" seguido de indicativo y número, como pide el spec (+573001234567).
const telefonoWhatsapp = z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{7,14}$/,
    "Usa formato internacional, por ejemplo +573001234567",
  );

const uuid = z.string().uuid("Selección inválida");

const camposComunes = {
  nombres,
  apellidos,
  numeroIdentificacion,
  telefonoWhatsapp,
  rolCodigo: z.enum(ROLES_ASIGNABLES, { message: "Selecciona un rol válido" }),
  /** Oficina principal. Obligatoria para GESTOR, nula para los demás. */
  oficinaId: uuid.nullish(),
  /** Oficinas del LIDER (relación N:M). Vacío para los demás roles. */
  oficinasIds: z.array(uuid).default([]),
};

/**
 * Coherencia entre rol y oficinas. Se aplica igual al alta y a la edición.
 */
function validarOficinas(
  datos: {
    rolCodigo: RolAsignable;
    oficinaId?: string | null;
    oficinasIds: string[];
  },
  ctx: z.RefinementCtx,
) {
  if (datos.rolCodigo === "GESTOR" && !datos.oficinaId) {
    ctx.addIssue({
      code: "custom",
      path: ["oficinaId"],
      message: "El Gestor debe tener una oficina asignada",
    });
  }

  if (datos.rolCodigo === "LIDER" && datos.oficinasIds.length === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["oficinasIds"],
      message: "El Líder debe tener al menos una oficina",
    });
  }
}

export const esquemaCrearUsuario = z
  .object({ email, ...camposComunes })
  .superRefine(validarOficinas);

/**
 * En la edición no va el correo: RN-12 lo declara inmutable, "es el
 * identificador de login, para cambiarlo se inactiva y se crea uno nuevo".
 */
export const esquemaActualizarUsuario = z
  .object({ id: uuid, ...camposComunes })
  .superRefine(validarOficinas);

export type EntradaCrearUsuario = z.infer<typeof esquemaCrearUsuario>;
export type EntradaActualizarUsuario = z.infer<typeof esquemaActualizarUsuario>;

/** Resultado uniforme de las server actions, para pintar errores por campo. */
export type ResultadoAccion =
  | { ok: true }
  | { ok: false; mensaje: string; errores?: Record<string, string> };
