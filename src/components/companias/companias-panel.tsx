"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Confirmacion } from "@/components/confirmacion";
import { Panel } from "@/components/panel";
import { DataTable, type Columna } from "@/components/tabla/data-table";
import { EstadoPill, type Estado } from "@/components/tabla/estado-pill";
import { CompaniaWizard } from "@/components/companias/compania-wizard";
import {
  CompaniaEditarDialog,
  type AdministradorDeCompania,
} from "@/components/companias/compania-editar-dialog";
import {
  OficinasDialog,
  type OficinaDeCompania,
} from "@/components/companias/oficinas-dialog";
import { ReemplazarAdminDialog } from "@/components/companias/reemplazar-admin-dialog";
import { cn } from "@/lib/utils";
import { cambiarEstadoCompania } from "@/app/crm/wantget/v1/(app)/companias/acciones";

/**
 * Tabla de compañías del Administrador General (CRM.docx §3.2).
 *
 * RN-03: se listan tanto las activas como las inactivas.
 * RN-01: no hay borrado, solo cambio de estado.
 */

export type FilaCompania = {
  id: string;
  nit: string;
  digitoVerificacion: string | null;
  razonSocial: string;
  estado: Estado;
  horaCierreSesion: string;
  administradores: AdministradorDeCompania[];
  oficinas: OficinaDeCompania[];
};

const BASE_BOTON =
  "inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-50";

function AccionesCompania({
  fila,
  onEditar,
}: {
  fila: FilaCompania;
  onEditar: () => void;
}) {
  const [pendiente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const activa = fila.estado === "ACTIVO";

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onEditar}
        disabled={pendiente}
        className={cn(BASE_BOTON, "border-border hover:bg-muted")}
      >
        Editar
      </button>

      <button
        type="button"
        disabled={pendiente}
        onClick={() => setConfirmando(true)}
        className={cn(
          BASE_BOTON,
          "border-want-rojo/40 text-want-rojo hover:bg-want-rojo/5",
        )}
      >
        {activa ? "Inactivar" : "Activar"}
      </button>

      <Confirmacion
        abierto={confirmando}
        peligroso={activa}
        pendiente={pendiente}
        titulo={activa ? "Inactivar compañía" : "Activar compañía"}
        textoConfirmar={activa ? "Inactivar" : "Activar"}
        descripcion={
          activa ? (
            <>
              Ningún usuario de{" "}
              <strong className="text-foreground">{fila.razonSocial}</strong>{" "}
              podrá iniciar sesión mientras esté inactiva. La compañía no se
              elimina: puedes volver a activarla cuando quieras.
            </>
          ) : (
            <>
              <strong className="text-foreground">{fila.razonSocial}</strong>{" "}
              volverá a operar y sus usuarios podrán iniciar sesión.
            </>
          )
        }
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() =>
          iniciar(async () => {
            const resultado = await cambiarEstadoCompania(fila.id);
            setConfirmando(false);
            if (resultado.ok) {
              toast.success(
                activa ? "Compañía inactivada" : "Compañía activada",
                { description: fila.razonSocial },
              );
            } else {
              toast.error(resultado.mensaje);
            }
          })
        }
      />
    </div>
  );
}

type Vista =
  | { tipo: "ninguna" }
  | { tipo: "nueva" }
  | { tipo: "editar"; companiaId: string }
  | { tipo: "oficinas"; companiaId: string }
  | {
      tipo: "reemplazar";
      companiaId: string;
      administrador: AdministradorDeCompania;
    };

export function CompaniasPanel({ companias }: { companias: FilaCompania[] }) {
  const [vista, setVista] = useState<Vista>({ tipo: "ninguna" });

  const seleccionada =
    "companiaId" in vista
      ? companias.find((c) => c.id === vista.companiaId)
      : undefined;

  const columnas: Columna<FilaCompania>[] = [
    {
      id: "nit",
      encabezado: "NIT",
      celda: (c) => (
        <span className="font-medium">
          {c.nit}
          {c.digitoVerificacion ? (
            <span className="text-muted-foreground">-{c.digitoVerificacion}</span>
          ) : null}
        </span>
      ),
    },
    {
      id: "razon",
      encabezado: "Razón social",
      celda: (c) => c.razonSocial,
    },
    {
      id: "admins",
      encabezado: "Administradores de compañía",
      ancho: "min-w-64",
      celda: (c) => {
        const activos = c.administradores.filter((a) => a.estado === "ACTIVO");
        if (activos.length === 0) {
          return <span className="text-muted-foreground">Sin administradores</span>;
        }
        return (
          <span className="text-muted-foreground">
            {activos.map((a) => a.email).join(" · ")}
          </span>
        );
      },
    },
    {
      id: "estado",
      encabezado: "Estado",
      celda: (c) => <EstadoPill estado={c.estado} genero="femenino" />,
    },
    {
      id: "acciones",
      encabezado: "Acción",
      alineacion: "derecha",
      celda: (c) => (
        <AccionesCompania
          fila={c}
          onEditar={() => setVista({ tipo: "editar", companiaId: c.id })}
        />
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Cree la compañía y sus dos administradores. Las compañías no se
          eliminan: para retirarlas cambie el estado a{" "}
          <strong className="text-foreground">Inactiva</strong>.
        </p>

        <button
          type="button"
          onClick={() => setVista({ tipo: "nueva" })}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-want-naranja px-4 text-sm font-semibold text-want-navy transition hover:brightness-95"
        >
          <Plus className="size-4" />
          Nueva compañía
        </button>
      </div>

      <Panel
        titulo="Gestión de Compañías"
        meta={`${companias.length} compañía(s)`}
      >
        <DataTable
          columnas={columnas}
          filas={companias}
          claveFila={(c) => c.id}
          vacio="Todavía no hay compañías registradas."
        />
      </Panel>

      {/* Los diálogos se montan solo cuando corresponde, así el formulario
          arranca limpio sin necesidad de un efecto que lo resincronice. */}
      {vista.tipo === "nueva" ? (
        <CompaniaWizard onCerrar={() => setVista({ tipo: "ninguna" })} />
      ) : null}

      {vista.tipo === "editar" && seleccionada ? (
        <CompaniaEditarDialog
          compania={seleccionada}
          onCerrar={() => setVista({ tipo: "ninguna" })}
          onGestionarOficinas={() =>
            setVista({ tipo: "oficinas", companiaId: seleccionada.id })
          }
          onReemplazarAdministrador={(administrador) =>
            setVista({
              tipo: "reemplazar",
              companiaId: seleccionada.id,
              administrador,
            })
          }
        />
      ) : null}

      {vista.tipo === "oficinas" && seleccionada ? (
        <OficinasDialog
          companiaId={seleccionada.id}
          razonSocial={seleccionada.razonSocial}
          oficinas={seleccionada.oficinas}
          onCerrar={() =>
            setVista({ tipo: "editar", companiaId: seleccionada.id })
          }
        />
      ) : null}

      {vista.tipo === "reemplazar" && seleccionada ? (
        <ReemplazarAdminDialog
          companiaId={seleccionada.id}
          administrador={vista.administrador}
          onCerrar={() =>
            setVista({ tipo: "editar", companiaId: seleccionada.id })
          }
        />
      ) : null}
    </>
  );
}
