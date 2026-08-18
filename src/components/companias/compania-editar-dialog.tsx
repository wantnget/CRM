"use client";

import { useState, useTransition } from "react";
import { Building2, RefreshCcw } from "lucide-react";
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
import { calcularDigitoVerificacion } from "@/lib/nit";
import { actualizarCompania } from "@/app/crm/wantget/v1/(app)/companias/acciones";

/**
 * Edición de una compañía.
 *
 * El NIT y el dígito de verificación arrancan bloqueados: son la identificación
 * tributaria y no se tocan por accidente. Cada uno tiene su propio botón para
 * habilitar la edición.
 *
 * Los administradores se muestran de solo lectura, con una acción explícita de
 * reemplazo. Editar el correo en un input sería engañoso: RN-12 lo declara
 * inmutable, así que cambiarlo implica inactivar al usuario y crear otro.
 */

export type AdministradorDeCompania = {
  id: string;
  email: string;
  nombreCompleto: string;
  estado: Estado;
};

export type CompaniaEditable = {
  id: string;
  nit: string;
  digitoVerificacion: string | null;
  razonSocial: string;
  estado: Estado;
  horaCierreSesion: string;
  administradores: AdministradorDeCompania[];
};

export function CompaniaEditarDialog({
  compania,
  onCerrar,
  onGestionarOficinas,
  onReemplazarAdministrador,
}: {
  compania: CompaniaEditable;
  onCerrar: () => void;
  onGestionarOficinas: () => void;
  onReemplazarAdministrador: (admin: AdministradorDeCompania) => void;
}) {
  const [enviando, iniciar] = useTransition();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [nit, setNit] = useState(compania.nit);
  const [nitEditable, setNitEditable] = useState(false);
  const [dv, setDv] = useState(
    compania.digitoVerificacion ?? calcularDigitoVerificacion(compania.nit) ?? "",
  );
  const [dvEditable, setDvEditable] = useState(false);
  const [razonSocial, setRazonSocial] = useState(compania.razonSocial);
  const [estado, setEstado] = useState<string>(compania.estado);
  const [horaCierre, setHoraCierre] = useState(compania.horaCierreSesion);

  function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrores({});
    setMensaje(null);

    iniciar(async () => {
      const resultado = await actualizarCompania({
        id: compania.id,
        nit,
        digitoVerificacion: dv,
        razonSocial,
        estado,
        horaCierreSesion: horaCierre,
      });

      if (resultado.ok) {
        // RN-02: editar confirma con un mensaje.
        toast.success("Compañía actualizada", { description: razonSocial });
        onCerrar();
        return;
      }
      setErrores(resultado.errores ?? {});
      setMensaje(resultado.mensaje);
    });
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && !enviando && onCerrar()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <p className={CLASE_ETIQUETA}>Gestión de Compañías</p>
          <DialogTitle className="text-xl font-semibold text-want-navy">
            Editar compañía
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={guardar}>
          <div className="space-y-5 px-6 py-6">
            <Campo
              etiqueta="NIT"
              error={errores.nit}
              accion={
                <button
                  type="button"
                  onClick={() => setNitEditable((v) => !v)}
                  className="text-[11px] font-medium text-want-navy underline"
                >
                  {nitEditable ? "Bloquear" : "Editar"}
                </button>
              }
              ayuda={
                nitEditable
                  ? "Cambiar el NIT afecta la identificación tributaria de la compañía."
                  : undefined
              }
            >
              <input
                className={CLASE_CAMPO}
                value={nit}
                readOnly={!nitEditable}
                onChange={(e) => setNit(e.target.value)}
              />
            </Campo>

            <Campo
              etiqueta="Dígito de verificación"
              error={errores.digitoVerificacion}
              accion={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const calculado = calcularDigitoVerificacion(nit);
                      if (calculado) setDv(calculado);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-want-navy underline"
                  >
                    <RefreshCcw className="size-3" />
                    Recalcular
                  </button>
                  <button
                    type="button"
                    onClick={() => setDvEditable((v) => !v)}
                    className="text-[11px] font-medium text-want-navy underline"
                  >
                    {dvEditable ? "Bloquear" : "Editar"}
                  </button>
                </div>
              }
              ayuda="Calculado con el algoritmo de la DIAN a partir del NIT."
            >
              <input
                className={cn(CLASE_CAMPO, "w-20")}
                value={dv}
                readOnly={!dvEditable}
                onChange={(e) => setDv(e.target.value)}
                inputMode="numeric"
                maxLength={1}
              />
            </Campo>

            <Campo etiqueta="Razón social" error={errores.razonSocial}>
              <input
                className={CLASE_CAMPO}
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                required
              />
            </Campo>

            <Campo etiqueta="Estado">
              <select
                className={CLASE_CAMPO}
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="ACTIVO">Activa</option>
                <option value="INACTIVO">Inactiva</option>
              </select>
            </Campo>

            <Campo
              etiqueta="Hora de cierre de sesión"
              error={errores.horaCierreSesion}
              ayuda="Aplica a todos los usuarios de la compañía."
            >
              <input
                type="time"
                className={cn(CLASE_CAMPO, "w-36")}
                value={horaCierre}
                onChange={(e) => setHoraCierre(e.target.value)}
              />
            </Campo>

            <div className="space-y-2 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <p className={CLASE_ETIQUETA}>Administradores de compañía</p>
              </div>

              {compania.administradores.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between gap-3 border-t border-border py-2 first:border-t-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {admin.nombreCompleto}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {admin.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <EstadoPill estado={admin.estado} />
                    <button
                      type="button"
                      onClick={() => onReemplazarAdministrador(admin)}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium transition hover:bg-muted"
                    >
                      Reemplazar
                    </button>
                  </div>
                </div>
              ))}

              <p className="pt-1 text-xs text-muted-foreground">
                El correo es el identificador de acceso y no se puede modificar.
                Reemplazar inactiva al administrador actual y crea uno nuevo.
              </p>
            </div>

            <button
              type="button"
              onClick={onGestionarOficinas}
              className={cn(BOTON_SECUNDARIO, "w-full")}
            >
              <Building2 className="mr-1.5 size-4" />
              Gestionar oficinas
            </button>

            <ErrorGeneral mensaje={mensaje} />
          </div>

          <DialogFooter className="border-t border-border px-6 py-4">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
