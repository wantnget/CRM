"use client";

import { useId, useState, useTransition } from "react";
import { DialogoFormulario } from "@/components/form/dialogo-formulario";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/components/form/campos";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ROLES_ASIGNABLES, type ResultadoAccion } from "@/lib/validaciones/usuario";
import {
  actualizarUsuario,
  crearUsuario,
} from "@/app/crm/wantget/v1/(app)/usuarios/acciones";

/**
 * Alta y edición de usuarios en un solo formulario (CRM.docx §4.2).
 *
 * Diferencias con el prototipo, todas por reglas del spec:
 * - Nombres y apellidos son dos campos, no uno: el modelo los separa para poder
 *   ordenar y buscar, y partir un string no es confiable con apellidos
 *   compuestos.
 * - Se agrega el teléfono de WhatsApp, que el prototipo omitía. Es obligatorio y
 *   sin él el usuario no puede autenticarse, porque el OTP viaja por ese canal
 *   (INC-01, marcado bloqueante en el spec).
 * - El correo es de solo lectura al editar: RN-12 lo declara inmutable.
 * - El rol ofrece solo Director, Líder y Gestor (RN-07 / RN-08).
 * - El estado no está acá: se cambia con el botón de la fila (RN-06).
 */

export type OficinaOpcion = { id: string; nombre: string };
export type LiderOpcion = { id: string; nombre: string };

export type UsuarioEditable = {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  numeroIdentificacion: string;
  telefonoWhatsapp: string;
  rolCodigo: string;
  oficinaId: string | null;
  oficinasIds: string[];
  /** Líder vigente del Gestor. Null si no tiene o si no es Gestor. */
  liderId: string | null;
};

const ETIQUETA_ROL: Record<string, string> = {
  DIRECTOR: "Director",
  LIDER: "Líder",
  GESTOR: "Gestor",
};

type Estado = {
  email: string;
  nombres: string;
  apellidos: string;
  numeroIdentificacion: string;
  telefonoWhatsapp: string;
  rolCodigo: string;
  oficinaId: string;
  oficinasIds: string[];
  liderId: string;
};

const VACIO: Estado = {
  email: "",
  nombres: "",
  apellidos: "",
  numeroIdentificacion: "",
  telefonoWhatsapp: "+57",
  rolCodigo: "GESTOR",
  oficinaId: "",
  oficinasIds: [],
  liderId: "",
};

function desde(usuario: UsuarioEditable): Estado {
  return {
    email: usuario.email,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    numeroIdentificacion: usuario.numeroIdentificacion,
    telefonoWhatsapp: usuario.telefonoWhatsapp,
    rolCodigo: usuario.rolCodigo,
    oficinaId: usuario.oficinaId ?? "",
    oficinasIds: usuario.oficinasIds,
    liderId: usuario.liderId ?? "",
  };
}

const CLASE_ETIQUETA =
  "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase";
const CLASE_CAMPO =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-want-navy focus:ring-2 focus:ring-want-navy/20 disabled:bg-muted disabled:text-muted-foreground";

function Campo({
  etiqueta,
  error,
  children,
}: {
  etiqueta: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className={cn(CLASE_ETIQUETA, "block")}>{etiqueta}</label>
      {children}
      {error ? <p className="text-xs text-want-rojo">{error}</p> : null}
    </div>
  );
}

function sinCampo(errores: Record<string, string>, campo: string) {
  if (!(campo in errores)) return errores;
  const copia = { ...errores };
  delete copia[campo];
  return copia;
}

/**
 * Se monta solo mientras está abierto (ver UsuariosPanel), así el estado inicial
 * se calcula en el montaje y no hace falta un efecto que lo sincronice.
 */
export function UsuarioDialog({
  onCerrar,
  usuario,
  oficinas,
  lideres,
}: {
  onCerrar: () => void;
  /** `null` = alta. Con valor = edición. */
  usuario: UsuarioEditable | null;
  oficinas: OficinaOpcion[];
  lideres: LiderOpcion[];
}) {
  const idBase = useId();
  const [datos, setDatos] = useState<Estado>(() =>
    usuario ? desde(usuario) : VACIO,
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const editando = usuario !== null;

  function cambiar<K extends keyof Estado>(campo: K, valor: Estado[K]) {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => sinCampo(previo, campo as string));
  }

  function alternarOficina(id: string) {
    setDatos((previo) => ({
      ...previo,
      oficinasIds: previo.oficinasIds.includes(id)
        ? previo.oficinasIds.filter((o) => o !== id)
        : [...previo.oficinasIds, id],
    }));
    setErrores((previo) => sinCampo(previo, "oficinasIds"));
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrores({});
    setMensaje(null);

    iniciarEnvio(async () => {
      const comun = {
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        numeroIdentificacion: datos.numeroIdentificacion,
        telefonoWhatsapp: datos.telefonoWhatsapp,
        rolCodigo: datos.rolCodigo,
        oficinaId: datos.rolCodigo === "GESTOR" ? datos.oficinaId || null : null,
        oficinasIds: datos.rolCodigo === "LIDER" ? datos.oficinasIds : [],
        liderId: datos.rolCodigo === "GESTOR" ? datos.liderId || null : null,
      };

      const resultado: ResultadoAccion = editando
        ? await actualizarUsuario({ ...comun, id: usuario.id })
        : await crearUsuario({ ...comun, email: datos.email });

      if (resultado.ok) {
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
        {enviando ? "Guardando..." : "Guardar"}
      </button>
    </>
  );

  return (
    <DialogoFormulario
      etiqueta="Usuarios"
      titulo={editando ? "Editar usuario" : "Nuevo usuario"}
      pie={pie}
      onCerrar={onCerrar}
      onSubmit={enviar}
    >
      <Campo etiqueta="Correo" error={errores.email}>
        <input
          type="email"
          className={CLASE_CAMPO}
          placeholder="usuario@wantnget.com.co"
          value={datos.email}
          onChange={(e) => cambiar("email", e.target.value)}
          // RN-12: el correo es el identificador de login y es inmutable.
          disabled={editando}
          required
        />
        {editando ? (
          <p className="text-xs text-muted-foreground">
            El correo es el identificador de acceso y no se puede
            modificar. Para cambiarlo, inactiva el usuario y crea uno nuevo.
          </p>
        ) : null}
      </Campo>

      <Campo
        etiqueta="Identificación"
        error={errores.numeroIdentificacion}
      >
        <input
          className={CLASE_CAMPO}
          placeholder="10125142"
          value={datos.numeroIdentificacion}
          onChange={(e) =>
            cambiar("numeroIdentificacion", e.target.value)
          }
          required
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombres" error={errores.nombres}>
          <input
            className={CLASE_CAMPO}
            placeholder="María Fernanda"
            value={datos.nombres}
            onChange={(e) => cambiar("nombres", e.target.value)}
            required
          />
        </Campo>

        <Campo etiqueta="Apellidos" error={errores.apellidos}>
          <input
            className={CLASE_CAMPO}
            placeholder="Arias Ospina"
            value={datos.apellidos}
            onChange={(e) => cambiar("apellidos", e.target.value)}
            required
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Teléfono de WhatsApp"
        error={errores.telefonoWhatsapp}
      >
        <input
          type="tel"
          className={CLASE_CAMPO}
          placeholder="+573001234567"
          value={datos.telefonoWhatsapp}
          onChange={(e) => cambiar("telefonoWhatsapp", e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          El código de verificación del inicio de sesión llega a este
          número.
        </p>
      </Campo>

      <Campo etiqueta="Rol" error={errores.rolCodigo}>
        <select
          className={CLASE_CAMPO}
          value={datos.rolCodigo}
          onChange={(e) => cambiar("rolCodigo", e.target.value)}
        >
          {ROLES_ASIGNABLES.map((rol) => (
            <option key={rol} value={rol}>
              {ETIQUETA_ROL[rol]}
            </option>
          ))}
        </select>
      </Campo>

      {/* La oficina depende del rol: el Gestor tiene una (y es obligatoria
          por el CHECK ck_usuario_gestor_con_oficina), el Líder puede tener
          varias (RN-13), y el Director no aplica. */}
      {datos.rolCodigo === "GESTOR" ? (
        <Campo etiqueta="Oficina" error={errores.oficinaId}>
          <select
            className={CLASE_CAMPO}
            value={datos.oficinaId}
            onChange={(e) => cambiar("oficinaId", e.target.value)}
          >
            <option value="">Selecciona una oficina</option>
            {oficinas.map((oficina) => (
              <option key={oficina.id} value={oficina.id}>
                {oficina.nombre}
              </option>
            ))}
          </select>
        </Campo>
      ) : null}

      {/* RN-19 / RN-20: el Gestor tiene un Líder vigente, y es lo que lo
          hace aparecer en la Consulta de ese Líder. La asignación se
          guarda en asignacion_gestor_lider con su vigencia. */}
      {datos.rolCodigo === "GESTOR" ? (
        <Campo etiqueta="Líder asignado" error={errores.liderId}>
          {lideres.length === 0 ? (
            <p className="rounded-lg bg-want-naranja/10 px-3 py-2 text-sm text-amber-800">
              No hay Líderes activos en la compañía. Crea primero un
              usuario con rol Líder para poder asignarle este Gestor.
            </p>
          ) : (
            <select
              className={CLASE_CAMPO}
              value={datos.liderId}
              onChange={(e) => cambiar("liderId", e.target.value)}
            >
              <option value="">Selecciona un Líder</option>
              {lideres.map((lider) => (
                <option key={lider.id} value={lider.id}>
                  {lider.nombre}
                </option>
              ))}
            </select>
          )}
        </Campo>
      ) : null}

      {datos.rolCodigo === "LIDER" ? (
        <Campo etiqueta="Oficinas a cargo" error={errores.oficinasIds}>
          <div className="space-y-2 rounded-lg border border-input p-3">
            {oficinas.map((oficina) => {
              const id = `${idBase}-of-${oficina.id}`;
              return (
                <div key={oficina.id} className="flex items-center gap-2.5">
                  <Checkbox
                    id={id}
                    checked={datos.oficinasIds.includes(oficina.id)}
                    onCheckedChange={() => alternarOficina(oficina.id)}
                  />
                  <label htmlFor={id} className="text-sm">
                    {oficina.nombre}
                  </label>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Un Líder puede tener varias oficinas asignadas.
          </p>
        </Campo>
      ) : null}

      {datos.rolCodigo === "DIRECTOR" ? (
        <Campo etiqueta="Oficina">
          <p className="text-sm text-muted-foreground">
            No aplica: el Director tiene alcance sobre toda la compañía.
          </p>
        </Campo>
      ) : null}

      {mensaje ? (
        <p className="rounded-lg bg-want-rojo/10 px-3 py-2 text-sm text-want-rojo">
          {mensaje}
        </p>
      ) : null}
    </DialogoFormulario>
  );
}
