"use client";

import { Campo, CLASE_CAMPO } from "@/components/form/campos";

/**
 * Los cinco datos mínimos de un Administrador de Compañía.
 *
 * El prototipo solo pedía el correo, pero `usuario` exige además identificación,
 * nombres, apellidos y teléfono, y sin el teléfono el administrador no puede
 * iniciar sesión: el OTP viaja por WhatsApp (INC-01 del spec).
 *
 * Se comparte entre el alta de la compañía y el reemplazo de un administrador.
 */

export type DatosAdministrador = {
  email: string;
  numeroIdentificacion: string;
  nombres: string;
  apellidos: string;
  telefonoWhatsapp: string;
};

export const ADMINISTRADOR_VACIO: DatosAdministrador = {
  email: "",
  numeroIdentificacion: "",
  nombres: "",
  apellidos: "",
  telefonoWhatsapp: "+57",
};

export function CamposAdministrador({
  datos,
  errores,
  prefijo,
  onCambiar,
}: {
  datos: DatosAdministrador;
  /** Errores por campo, ya resueltos al prefijo de este administrador. */
  errores: Record<string, string>;
  /** Prefijo del error que devuelve zod, p. ej. "administradores.0". */
  prefijo?: string;
  onCambiar: (campo: keyof DatosAdministrador, valor: string) => void;
}) {
  const error = (campo: keyof DatosAdministrador) =>
    errores[prefijo ? `${prefijo}.${campo}` : campo];

  return (
    <div className="space-y-4">
      <Campo etiqueta="Correo" error={error("email")}>
        <input
          type="email"
          className={CLASE_CAMPO}
          placeholder="usuario@wantnget.com.co"
          value={datos.email}
          onChange={(e) => onCambiar("email", e.target.value)}
          required
        />
      </Campo>

      <Campo etiqueta="Identificación" error={error("numeroIdentificacion")}>
        <input
          className={CLASE_CAMPO}
          placeholder="10125142"
          value={datos.numeroIdentificacion}
          onChange={(e) => onCambiar("numeroIdentificacion", e.target.value)}
          required
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombres" error={error("nombres")}>
          <input
            className={CLASE_CAMPO}
            placeholder="María Fernanda"
            value={datos.nombres}
            onChange={(e) => onCambiar("nombres", e.target.value)}
            required
          />
        </Campo>

        <Campo etiqueta="Apellidos" error={error("apellidos")}>
          <input
            className={CLASE_CAMPO}
            placeholder="Arias Ospina"
            value={datos.apellidos}
            onChange={(e) => onCambiar("apellidos", e.target.value)}
            required
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Teléfono de WhatsApp"
        error={error("telefonoWhatsapp")}
        ayuda="El código de verificación del inicio de sesión llega a este número."
      >
        <input
          type="tel"
          className={CLASE_CAMPO}
          placeholder="+573001234567"
          value={datos.telefonoWhatsapp}
          onChange={(e) => onCambiar("telefonoWhatsapp", e.target.value)}
          required
        />
      </Campo>
    </div>
  );
}
