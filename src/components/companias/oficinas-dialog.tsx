"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  Campo,
  CLASE_CAMPO,
  CLASE_ETIQUETA,
  ErrorGeneral,
} from "@/components/form/campos";
import { EstadoPill, type Estado } from "@/components/tabla/estado-pill";
import { cn } from "@/lib/utils";
import {
  cambiarEstadoOficina,
  guardarOficina,
} from "@/app/crm/wantget/v1/(app)/companias/acciones";

/**
 * Administración de las oficinas de una compañía.
 *
 * Resuelve la pregunta abierta PA-02 del spec, que dejaba sin dueño el CRUD de
 * oficinas pese a que el campo es obligatorio para Líder y Gestor. Queda en
 * manos del Administrador General, junto a la compañía a la que pertenecen.
 *
 * Igual que el resto del modelo, las oficinas no se borran: se inactivan.
 */

export type OficinaDeCompania = {
  id: string;
  codigo: string;
  nombre: string;
  estado: Estado;
  /** Usuarios activos que la tienen asignada; bloquea la inactivación. */
  usuariosActivos: number;
};

export function OficinasDialog({
  companiaId,
  razonSocial,
  oficinas,
  onCerrar,
}: {
  companiaId: string;
  razonSocial: string;
  oficinas: OficinaDeCompania[];
  onCerrar: () => void;
}) {
  const [pendiente, iniciar] = useTransition();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");

  function limpiar() {
    setEditandoId(null);
    setCodigo("");
    setNombre("");
    setErrores({});
    setMensaje(null);
  }

  function guardar() {
    setErrores({});
    setMensaje(null);

    iniciar(async () => {
      const resultado = await guardarOficina({
        companiaId,
        id: editandoId ?? undefined,
        codigo,
        nombre,
      });

      if (resultado.ok) {
        toast.success(editandoId ? "Oficina actualizada" : "Oficina creada", {
          description: nombre,
        });
        limpiar();
        return;
      }
      setErrores(resultado.errores ?? {});
      setMensaje(resultado.mensaje);
    });
  }

  function alternarEstado(oficina: OficinaDeCompania) {
    setMensaje(null);
    iniciar(async () => {
      const resultado = await cambiarEstadoOficina(oficina.id);
      if (resultado.ok) {
        toast.success(
          oficina.estado === "ACTIVO" ? "Oficina inactivada" : "Oficina activada",
          { description: oficina.nombre },
        );
        return;
      }
      setMensaje(resultado.mensaje);
    });
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && !pendiente && onCerrar()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <p className={CLASE_ETIQUETA}>{razonSocial}</p>
          <DialogTitle className="text-xl font-semibold text-want-navy">
            Oficinas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-lg border border-border">
            {oficinas.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Esta compañía todavía no tiene oficinas.
              </p>
            ) : (
              oficinas.map((oficina) => (
                <div
                  key={oficina.id}
                  className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {oficina.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {oficina.codigo}
                      {oficina.usuariosActivos > 0
                        ? ` · ${oficina.usuariosActivos} usuario(s)`
                        : null}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <EstadoPill estado={oficina.estado} genero="femenino" />
                    <button
                      type="button"
                      disabled={pendiente}
                      onClick={() => {
                        setEditandoId(oficina.id);
                        setCodigo(oficina.codigo);
                        setNombre(oficina.nombre);
                        setErrores({});
                      }}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={pendiente}
                      onClick={() => alternarEstado(oficina)}
                      className="rounded-md border border-want-rojo/40 px-2.5 py-1 text-xs font-medium text-want-rojo transition hover:bg-want-rojo/5 disabled:opacity-50"
                    >
                      {oficina.estado === "ACTIVO" ? "Inactivar" : "Activar"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4 rounded-lg border border-border p-4">
            <p className={CLASE_ETIQUETA}>
              {editandoId ? "Editar oficina" : "Nueva oficina"}
            </p>

            <div className="flex items-end gap-2">
              <div className="w-32">
                <Campo etiqueta="Código" error={errores.codigo}>
                  <input
                    className={CLASE_CAMPO}
                    placeholder="NORTE"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                  />
                </Campo>
              </div>
              <div className="flex-1">
                <Campo etiqueta="Nombre" error={errores.nombre}>
                  <input
                    className={CLASE_CAMPO}
                    placeholder="Norte"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </Campo>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={guardar}
                disabled={pendiente || !codigo || !nombre}
                className={cn(BOTON_PRIMARIO, "flex-1")}
              >
                {editandoId ? (
                  "Guardar cambios"
                ) : (
                  <>
                    <Plus className="mr-1.5 size-4" />
                    Agregar
                  </>
                )}
              </button>
              {editandoId ? (
                <button
                  type="button"
                  onClick={limpiar}
                  disabled={pendiente}
                  className={BOTON_SECUNDARIO}
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </div>

          <ErrorGeneral mensaje={mensaje} />
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onCerrar}
            disabled={pendiente}
            className={BOTON_SECUNDARIO}
          >
            Cerrar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
