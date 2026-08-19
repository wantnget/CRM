"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
  ADMINISTRADOR_VACIO,
  CamposAdministrador,
  type DatosAdministrador,
} from "@/components/companias/campos-administrador";
import { cn } from "@/lib/utils";
import { calcularDigitoVerificacion } from "@/lib/nit";
import { crearCompania } from "@/app/crm/wantget/v1/(app)/companias/acciones";

/**
 * Alta de compañía en tres pasos (CRM.docx §3.2).
 *
 * Se guarda todo al final en una sola transacción porque RN-04 exige que la
 * compañía y sus administradores se creen juntos. Las oficinas van en el mismo
 * envío: sin al menos una, el Administrador de Compañía no podría crear Líderes
 * ni Gestores, así que la compañía nacería inutilizable.
 */

const PASOS = ["Compañía", "Oficinas", "Administradores"] as const;

type Oficina = { codigo: string; nombre: string };

const HORA_POR_DEFECTO = "18:30";

export function CompaniaWizard({ onCerrar }: { onCerrar: () => void }) {
  const [paso, setPaso] = useState(0);
  const [enviando, iniciar] = useTransition();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [nit, setNit] = useState("");
  const [dvManual, setDvManual] = useState<string | null>(null);
  const [razonSocial, setRazonSocial] = useState("");
  const [estado, setEstado] = useState("ACTIVO");
  const [horaCierre, setHoraCierre] = useState(HORA_POR_DEFECTO);

  const [oficinas, setOficinas] = useState<Oficina[]>([
    { codigo: "", nombre: "" },
  ]);
  const [administradores, setAdministradores] = useState<DatosAdministrador[]>([
    { ...ADMINISTRADOR_VACIO },
    { ...ADMINISTRADOR_VACIO },
  ]);

  // El dígito se calcula del NIT salvo que se haya corregido a mano.
  const dvCalculado = calcularDigitoVerificacion(nit);
  const dv = dvManual ?? dvCalculado ?? "";

  function limpiarError(campo: string) {
    setErrores((previo) => {
      if (!(campo in previo)) return previo;
      const copia = { ...previo };
      delete copia[campo];
      return copia;
    });
  }

  function cambiarOficina(indice: number, campo: keyof Oficina, valor: string) {
    setOficinas((previo) =>
      previo.map((o, i) => (i === indice ? { ...o, [campo]: valor } : o)),
    );
    limpiarError("oficinas");
  }

  function cambiarAdministrador(
    indice: number,
    campo: keyof DatosAdministrador,
    valor: string,
  ) {
    setAdministradores((previo) =>
      previo.map((a, i) => (i === indice ? { ...a, [campo]: valor } : a)),
    );
    limpiarError(`administradores.${indice}.${campo}`);
  }

  function guardar() {
    setErrores({});
    setMensaje(null);

    iniciar(async () => {
      const resultado = await crearCompania({
        nit,
        digitoVerificacion: dv,
        razonSocial,
        estado,
        horaCierreSesion: horaCierre,
        oficinas,
        administradores,
      });

      if (resultado.ok) {
        // RN-02: la creación confirma con un mensaje.
        toast.success("Compañía creada", {
          description: `${razonSocial} quedó registrada con sus dos administradores.`,
        });
        onCerrar();
        return;
      }

      setErrores(resultado.errores ?? {});
      setMensaje(resultado.mensaje);
      // Si el error corresponde a un paso anterior, se vuelve para mostrarlo.
      const campos = Object.keys(resultado.errores ?? {});
      if (campos.some((c) => c.startsWith("oficinas"))) setPaso(1);
      else if (campos.some((c) => !c.startsWith("administradores"))) setPaso(0);
    });
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && !enviando && onCerrar()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <p className={CLASE_ETIQUETA}>Gestión de Compañías</p>
          <DialogTitle className="text-xl font-semibold text-want-navy">
            Nueva compañía
          </DialogTitle>

          <ol className="mt-3 flex gap-2">
            {PASOS.map((titulo, i) => (
              <li
                key={titulo}
                className={cn(
                  "flex-1 rounded-full border px-2 py-1 text-center text-[11px] font-medium",
                  i === paso
                    ? "border-want-navy bg-want-navy text-white"
                    : i < paso
                      ? "border-want-verde/40 bg-want-verde/10 text-emerald-700"
                      : "border-border text-muted-foreground",
                )}
              >
                {i + 1}. {titulo}
              </li>
            ))}
          </ol>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          {paso === 0 ? (
            <>
              <Campo etiqueta="NIT" error={errores.nit}>
                <input
                  className={CLASE_CAMPO}
                  placeholder="900100200"
                  value={nit}
                  onChange={(e) => {
                    setNit(e.target.value);
                    setDvManual(null);
                    limpiarError("nit");
                  }}
                  required
                />
              </Campo>

              <Campo
                etiqueta="Dígito de verificación"
                error={errores.digitoVerificacion}
                ayuda="Se calcula automáticamente a partir del NIT con el algoritmo de la DIAN. Si el registrado en la Cámara de Comercio es otro, actívalo y corrígelo."
                accion={
                  <button
                    type="button"
                    onClick={() =>
                      setDvManual((previo) => (previo === null ? dv : null))
                    }
                    className="text-[11px] font-medium text-want-navy underline"
                  >
                    {dvManual === null ? "Editar" : "Volver a calcular"}
                  </button>
                }
              >
                <input
                  className={cn(CLASE_CAMPO, "w-20")}
                  value={dv}
                  readOnly={dvManual === null}
                  onChange={(e) => setDvManual(e.target.value)}
                  inputMode="numeric"
                  maxLength={1}
                />
              </Campo>

              <Campo etiqueta="Razón social" error={errores.razonSocial}>
                <input
                  className={CLASE_CAMPO}
                  placeholder="Fondo Want"
                  value={razonSocial}
                  onChange={(e) => {
                    setRazonSocial(e.target.value);
                    limpiarError("razonSocial");
                  }}
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
                ayuda="Hora a la que se cierra automáticamente la sesión de todos los usuarios de la compañía."
              >
                <input
                  type="time"
                  className={cn(CLASE_CAMPO, "w-36")}
                  value={horaCierre}
                  onChange={(e) => {
                    setHoraCierre(e.target.value);
                    limpiarError("horaCierreSesion");
                  }}
                />
              </Campo>
            </>
          ) : null}

          {paso === 1 ? (
            <>
              <p className="text-sm text-muted-foreground">
                La compañía necesita al menos una oficina: es obligatoria para
                los roles Líder y Gestor.
              </p>

              {oficinas.map((oficina, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="w-32">
                    <Campo etiqueta="Código">
                      <input
                        className={CLASE_CAMPO}
                        placeholder="NORTE"
                        value={oficina.codigo}
                        onChange={(e) =>
                          cambiarOficina(i, "codigo", e.target.value)
                        }
                      />
                    </Campo>
                  </div>
                  <div className="flex-1">
                    <Campo etiqueta="Nombre">
                      <input
                        className={CLASE_CAMPO}
                        placeholder="Norte"
                        value={oficina.nombre}
                        onChange={(e) =>
                          cambiarOficina(i, "nombre", e.target.value)
                        }
                      />
                    </Campo>
                  </div>
                  <button
                    type="button"
                    aria-label="Quitar oficina"
                    disabled={oficinas.length === 1}
                    onClick={() =>
                      setOficinas((previo) => previo.filter((_, j) => j !== i))
                    }
                    className="mb-0.5 inline-flex size-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}

              {errores.oficinas ? (
                <p className="text-xs text-want-rojo">{errores.oficinas}</p>
              ) : null}

              <button
                type="button"
                onClick={() =>
                  setOficinas((previo) => [...previo, { codigo: "", nombre: "" }])
                }
                className={cn(BOTON_SECUNDARIO, "w-full")}
              >
                <Plus className="mr-1.5 size-4" />
                Agregar oficina
              </button>
            </>
          ) : null}

          {paso === 2 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Toda compañía se crea con exactamente dos Administradores de
                Compañía.
              </p>

              {administradores.map((admin, i) => (
                <fieldset
                  key={i}
                  className="space-y-4 rounded-lg border border-border p-4"
                >
                  <legend className={cn(CLASE_ETIQUETA, "px-1")}>
                    Administrador de compañía {i + 1}
                  </legend>
                  <CamposAdministrador
                    datos={admin}
                    errores={errores}
                    prefijo={`administradores.${i}`}
                    onCambiar={(campo, valor) =>
                      cambiarAdministrador(i, campo, valor)
                    }
                  />
                </fieldset>
              ))}
            </>
          ) : null}

          <ErrorGeneral mensaje={mensaje} />
        </div>

        <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
          <button
            type="button"
            onClick={() => (paso === 0 ? onCerrar() : setPaso(paso - 1))}
            disabled={enviando}
            className={BOTON_SECUNDARIO}
          >
            {paso === 0 ? "Cancelar" : "Atrás"}
          </button>

          {paso < PASOS.length - 1 ? (
            <button
              type="button"
              onClick={() => setPaso(paso + 1)}
              className={BOTON_PRIMARIO}
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={guardar}
              disabled={enviando}
              className={BOTON_PRIMARIO}
            >
              {enviando ? "Guardando..." : "Guardar"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
