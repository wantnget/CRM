"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DialogoFormulario } from "@/components/form/dialogo-formulario";
import {
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  ErrorGeneral,
} from "@/components/form/campos";
import {
  ADMINISTRADOR_VACIO,
  CamposAdministrador,
  type DatosAdministrador,
} from "@/components/companias/campos-administrador";
import type { AdministradorDeCompania } from "@/components/companias/compania-editar-dialog";
import { reemplazarAdministrador } from "@/app/crm/wantget/v1/(app)/companias/acciones";

/**
 * Reemplazo de un Administrador de Compañía.
 *
 * No se edita el correo del actual porque RN-12 lo declara inmutable: se
 * inactiva y se crea uno nuevo en la misma transacción, así la compañía nunca
 * queda sin administradores activos (RN-10).
 */
export function ReemplazarAdminDialog({
  companiaId,
  administrador,
  onCerrar,
}: {
  companiaId: string;
  administrador: AdministradorDeCompania;
  onCerrar: () => void;
}) {
  const [enviando, iniciar] = useTransition();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosAdministrador>({
    ...ADMINISTRADOR_VACIO,
  });

  function cambiar(campo: keyof DatosAdministrador, valor: string) {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => {
      const clave = `nuevo.${campo}`;
      if (!(clave in previo)) return previo;
      const copia = { ...previo };
      delete copia[clave];
      return copia;
    });
  }

  function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrores({});
    setMensaje(null);

    iniciar(async () => {
      const resultado = await reemplazarAdministrador({
        companiaId,
        administradorId: administrador.id,
        nuevo: datos,
      });

      if (resultado.ok) {
        toast.success("Administrador reemplazado", {
          description: `${administrador.email} quedó inactivo y ${datos.email} tomó su lugar.`,
        });
        onCerrar();
        return;
      }
      setErrores(resultado.errores ?? {});
      setMensaje(resultado.mensaje);
    });
  }

  const pie = (
    <>
      <button
        type="button"
        onClick={onCerrar}
        disabled={enviando}
        className={BOTON_SECUNDARIO}
      >
        Cancelar
      </button>
      <button type="submit" disabled={enviando} className={BOTON_PRIMARIO}>
        {enviando ? "Reemplazando..." : "Reemplazar"}
      </button>
    </>
  );

  return (
    <DialogoFormulario
      etiqueta="Gestión de Compañías"
      titulo="Reemplazar administrador"
      pie={pie}
      onCerrar={onCerrar}
      bloqueado={enviando}
      onSubmit={guardar}
    >
      <p className="rounded-lg bg-want-naranja/10 px-3 py-2 text-sm text-amber-900">
        <strong>{administrador.nombreCompleto}</strong> (
        {administrador.email}) quedará inactivo y el nuevo administrador
        tomará su lugar. El usuario no se elimina.
      </p>

      <CamposAdministrador
        datos={datos}
        errores={errores}
        prefijo="nuevo"
        onCambiar={cambiar}
      />

      <ErrorGeneral mensaje={mensaje} />
    </DialogoFormulario>
  );
}
