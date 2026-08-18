"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Confirmacion } from "@/components/confirmacion";
import { Panel } from "@/components/panel";
import { DataTable, type Columna } from "@/components/tabla/data-table";
import { EstadoPill, type Estado } from "@/components/tabla/estado-pill";
import { RolBadge } from "@/components/tabla/rol-badge";
import { CanalesToggle } from "@/components/usuarios/canales-toggle";
import {
  UsuarioDialog,
  type LiderOpcion,
  type OficinaOpcion,
  type UsuarioEditable,
} from "@/components/usuarios/usuario-dialog";
import { cn } from "@/lib/utils";
import { esRolConocido, type RolCodigo } from "@/lib/navegacion";
import { ROLES_ASIGNABLES } from "@/lib/validaciones/usuario";
import { cambiarEstadoUsuario } from "@/app/crm/wantget/v1/(app)/usuarios/acciones";

/**
 * Tabla de Usuarios con sus acciones (CRM.docx §4.2).
 *
 * Es un componente cliente porque las celdas son interactivas: los canales se
 * alternan desde la tabla y las filas abren el diálogo. La consulta sigue
 * ocurriendo en el server component que lo monta.
 */

export type FilaUsuario = {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  numeroIdentificacion: string;
  telefonoWhatsapp: string;
  estado: Estado;
  rolCodigo: string;
  rolNombre: string;
  oficinaId: string | null;
  oficinaNombre: string | null;
  oficinasIds: string[];
  liderId: string | null;
  canales: { canalCodigo: string; habilitado: boolean }[];
};

/** RN-07 / RN-08: la Admin de Compañía solo administra Director, Líder y Gestor. */
function administrableAqui(rolCodigo: string) {
  return (ROLES_ASIGNABLES as readonly string[]).includes(rolCodigo);
}

const BASE_BOTON =
  "inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-50";

function AccionesUsuario({
  fila,
  onEditar,
}: {
  fila: FilaUsuario;
  onEditar: () => void;
}) {
  const [pendiente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const editable = administrableAqui(fila.rolCodigo);
  const activo = fila.estado === "ACTIVO";
  const nombre = `${fila.nombres} ${fila.apellidos}`;

  const motivo = editable
    ? undefined
    : "Las cuentas de Administrador de Compañía las gestiona el Administrador General";

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onEditar}
        disabled={!editable || pendiente}
        title={motivo}
        className={cn(BASE_BOTON, "border-border hover:bg-muted")}
      >
        Editar
      </button>

      <button
        type="button"
        disabled={!editable || pendiente}
        title={motivo}
        onClick={() => setConfirmando(true)}
        className={cn(
          BASE_BOTON,
          "border-want-rojo/40 text-want-rojo hover:bg-want-rojo/5",
        )}
      >
        {activo ? "Inactivar" : "Activar"}
      </button>

      <Confirmacion
        abierto={confirmando}
        peligroso={activo}
        pendiente={pendiente}
        titulo={activo ? "Inactivar usuario" : "Activar usuario"}
        textoConfirmar={activo ? "Inactivar" : "Activar"}
        descripcion={
          activo ? (
            <>
              <strong className="text-foreground">{nombre}</strong> no podrá
              iniciar sesión ni recibir códigos de verificación. El usuario no se
              elimina: puedes volver a activarlo cuando quieras.
            </>
          ) : (
            <>
              <strong className="text-foreground">{nombre}</strong> volverá a
              tener acceso a la plataforma.
            </>
          )
        }
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() =>
          iniciar(async () => {
            await cambiarEstadoUsuario(fila.id);
            setConfirmando(false);
          })
        }
      />
    </div>
  );
}

export function UsuariosPanel({
  usuarios,
  oficinas,
  lideres,
}: {
  usuarios: FilaUsuario[];
  oficinas: OficinaOpcion[];
  lideres: LiderOpcion[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<UsuarioEditable | null>(null);

  function abrirAlta() {
    setEnEdicion(null);
    setAbierto(true);
  }

  function abrirEdicion(fila: FilaUsuario) {
    setEnEdicion({
      id: fila.id,
      email: fila.email,
      nombres: fila.nombres,
      apellidos: fila.apellidos,
      numeroIdentificacion: fila.numeroIdentificacion,
      telefonoWhatsapp: fila.telefonoWhatsapp,
      rolCodigo: fila.rolCodigo,
      oficinaId: fila.oficinaId,
      oficinasIds: fila.oficinasIds,
      liderId: fila.liderId,
    });
    setAbierto(true);
  }

  const columnas: Columna<FilaUsuario>[] = [
    {
      id: "usuario",
      encabezado: "Usuario",
      celda: (u) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {u.nombres} {u.apellidos}
          </p>
          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    {
      id: "identificacion",
      encabezado: "Identificación",
      celda: (u) => u.numeroIdentificacion,
    },
    {
      id: "rol",
      encabezado: "Rol",
      celda: (u) =>
        esRolConocido(u.rolCodigo) ? (
          <RolBadge codigo={u.rolCodigo as RolCodigo} nombre={u.rolNombre} />
        ) : (
          u.rolNombre
        ),
    },
    {
      id: "oficina",
      encabezado: "Oficina",
      celda: (u) =>
        u.oficinaNombre ?? (
          <span className="text-muted-foreground">No aplica</span>
        ),
    },
    {
      id: "canales",
      encabezado: "Canales de comunicación",
      // Sin ancho mínimo la tabla le asigna menos de lo que ocupan 3 píldoras
      // y los canales se parten en 3 líneas en vez de 2.
      ancho: "min-w-64",
      celda: (u) => (
        <CanalesToggle
          usuarioId={u.id}
          canales={u.canales}
          editable={administrableAqui(u.rolCodigo)}
        />
      ),
    },
    {
      id: "estado",
      encabezado: "Estado",
      celda: (u) => <EstadoPill estado={u.estado} />,
    },
    {
      id: "acciones",
      encabezado: "Acción",
      alineacion: "derecha",
      celda: (u) => (
        <AccionesUsuario fila={u} onEditar={() => abrirEdicion(u)} />
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Asigne el rol de plataforma a cada usuario. Para el rol Gestor habilite
          los canales de comunicación disponibles en su bandeja de prospección
          haciendo clic sobre cada canal.
        </p>

        <button
          type="button"
          onClick={abrirAlta}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-want-naranja px-4 text-sm font-semibold text-want-navy transition hover:brightness-95"
        >
          <Plus className="size-4" />
          Nuevo usuario
        </button>
      </div>

      <Panel
        titulo="Usuarios de la compañía"
        meta={`${usuarios.length} usuario(s)`}
      >
        <DataTable
          columnas={columnas}
          filas={usuarios}
          claveFila={(u) => u.id}
          vacio="Esta compañía todavía no tiene usuarios registrados."
        />
      </Panel>

      {/* Se monta solo al abrir para que el formulario arranque limpio sin
          necesidad de un efecto que lo resincronice. */}
      {abierto ? (
        <UsuarioDialog
          onCerrar={() => setAbierto(false)}
          usuario={enEdicion}
          oficinas={oficinas}
          // El propio usuario no puede figurar como su líder.
          lideres={lideres.filter((l) => l.id !== enEdicion?.id)}
        />
      ) : null}
    </>
  );
}
