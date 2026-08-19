import { z } from "zod";
import { camposUsuario } from "@/lib/validaciones/usuario";

/**
 * Validación del alta y edición de compañías (CRM.docx §3.2).
 *
 * Reglas del spec que se hacen cumplir acá:
 * - RN-04 / RN-10: la compañía se crea junto con exactamente 2 Administradores
 *   de Compañía, en una sola transacción.
 * - Sin oficinas la compañía queda inutilizable: su Administrador no podría
 *   crear Líderes ni Gestores, porque ck_usuario_gestor_con_oficina y RN-13 las
 *   exigen. Por eso se pide al menos una en el alta (resuelve PA-02).
 * - RN-01: no hay borrado, solo cambio de estado.
 */

const uuid = z.string().uuid("Selección inválida");

const nit = z
  .string()
  .trim()
  .min(5, "Mínimo 5 dígitos")
  .max(20, "Máximo 20 caracteres")
  .regex(/^\d+$/, "El NIT se registra sin puntos, guiones ni dígito de verificación");

const digitoVerificacion = z
  .string()
  .trim()
  .regex(/^\d$/, "El dígito de verificación es un solo número");

const razonSocial = z
  .string()
  .trim()
  .min(3, "Mínimo 3 caracteres")
  .max(200, "Máximo 200 caracteres");

const estado = z.enum(["ACTIVO", "INACTIVO"]);

/**
 * Hora de cierre automático de la sesión de toda la compañía. Es la decisión
 * que resolvió PA-04, así que se configura por compañía en vez de quedar fija.
 */
const horaCierreSesion = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa el formato HH:MM, por ejemplo 18:30");

const codigoOficina = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(20, "Máximo 20 caracteres")
  .regex(/^[A-Za-z0-9_-]+$/, "Solo letras, números, guion y guion bajo")
  .transform((v) => v.toUpperCase());

const nombreOficina = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(120, "Máximo 120 caracteres");

export const esquemaOficinaNueva = z.object({
  codigo: codigoOficina,
  nombre: nombreOficina,
});

/** Datos mínimos para dar de alta a un Administrador de Compañía. */
export const esquemaAdministrador = z.object({ ...camposUsuario });

export type EntradaAdministrador = z.infer<typeof esquemaAdministrador>;

const datosCompania = {
  nit,
  digitoVerificacion,
  razonSocial,
  estado,
  horaCierreSesion,
};

/** No se puede repetir el mismo correo ni la misma cédula entre los dos admins. */
function validarAdministradores(
  administradores: EntradaAdministrador[],
  ctx: z.RefinementCtx,
) {
  const [primero, segundo] = administradores;
  if (!primero || !segundo) return;

  if (primero.email === segundo.email) {
    ctx.addIssue({
      code: "custom",
      path: ["administradores", 1, "email"],
      message: "Los dos administradores deben tener correos distintos",
    });
  }
  if (primero.numeroIdentificacion === segundo.numeroIdentificacion) {
    ctx.addIssue({
      code: "custom",
      path: ["administradores", 1, "numeroIdentificacion"],
      message: "Los dos administradores deben tener identificaciones distintas",
    });
  }
}

export const esquemaCrearCompania = z
  .object({
    ...datosCompania,
    oficinas: z
      .array(esquemaOficinaNueva)
      .min(1, "Agrega al menos una oficina")
      .max(50, "Demasiadas oficinas"),
    // RN-10: exactamente 2 administradores activos al momento de la creación.
    administradores: z
      .array(esquemaAdministrador)
      .length(2, "La compañía se crea con exactamente 2 administradores"),
  })
  .superRefine((datos, ctx) => {
    validarAdministradores(datos.administradores, ctx);

    const codigos = datos.oficinas.map((o) => o.codigo);
    if (new Set(codigos).size !== codigos.length) {
      ctx.addIssue({
        code: "custom",
        path: ["oficinas"],
        message: "Hay códigos de oficina repetidos",
      });
    }
  });

export const esquemaActualizarCompania = z.object({
  id: uuid,
  ...datosCompania,
});

export const esquemaOficina = z.object({
  companiaId: uuid,
  /** Ausente al crear. */
  id: uuid.optional(),
  codigo: codigoOficina,
  nombre: nombreOficina,
});

/**
 * Reemplazo de un Administrador de Compañía: se inactiva el actual y se crea
 * el nuevo. No se edita el correo del existente porque RN-12 lo declara
 * inmutable, y así la compañía nunca se queda sin administradores (RN-10).
 */
export const esquemaReemplazarAdministrador = z.object({
  companiaId: uuid,
  administradorId: uuid,
  nuevo: esquemaAdministrador,
});

export type EntradaCrearCompania = z.infer<typeof esquemaCrearCompania>;
export type EntradaActualizarCompania = z.infer<typeof esquemaActualizarCompania>;
export type EntradaOficina = z.infer<typeof esquemaOficina>;
