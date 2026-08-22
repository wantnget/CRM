"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import {
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  Campo,
  CLASE_CAMPO,
  CLASE_ETIQUETA,
  ErrorGeneral,
} from "@/components/form/campos";
import { DialogoFormulario } from "@/components/form/dialogo-formulario";
import {
  ADMINISTRADOR_VACIO,
  CamposAdministrador,
  type DatosAdministrador,
} from "@/components/companias/campos-administrador";
import { cn } from "@/lib/utils";
import { calcularDigitoVerificacion } from "@/lib/nit";
import {
  esquemaAdministradoresNuevos,
  esquemaDatosCompania,
  esquemaOficinasNuevas,
} from "@/lib/validaciones/compania";
import { crearCompania } from "@/app/crm/wantget/v1/(app)/companias/acciones";

/**
 * Alta de compañía en tres pasos (CRM.docx §3.2).
 *
 * Se guarda todo al final en una sola transacción porque RN-04 exige que la
 * compañía y sus administradores se creen juntos. Las oficinas van en el mismo
 * envío: sin al menos una, el Administrador de Compañía no podría crear Líderes
 * ni Gestores, así que la compañía nacería inutilizable.
 *
 * "Siguiente" valida el paso antes de avanzar, con los mismos esquemas que usa
 * la server action. El servidor sigue siendo la autoridad — esta validación es
 * solo para no descubrir un campo vacío del paso 1 recién al apretar Guardar.
 */

const PASOS = ["Compañía", "Oficinas", "Administradores"] as const;

type Oficina = { id: string; codigo: string; nombre: string };

const HORA_POR_DEFECTO = "18:30";

// Identidad estable por oficina para usarla como key de React. Un contador de
// módulo y no crypto.randomUUID() para que el valor inicial coincida entre el
// render del servidor y la hidratación.
let contadorOficinas = 0;
function oficinaVacia(): Oficina {
  contadorOficinas += 1;
  return { id: `oficina-${contadorOficinas}`, codigo: "", nombre: "" };
}

/**
 * Aplana los issues de zod a la forma "campo" o "prefijo.indice.campo" que
 * leen los formularios. Es la misma conversión que hace la server action, con
 * un prefijo opcional para los esquemas que se validan sueltos por paso.
 */
function erroresDeZod(error: z.ZodError, prefijo?: string) {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const ruta = [prefijo, ...issue.path].filter(Boolean).join(".");
    errores[ruta || "general"] ??= issue.message;
  }
  return errores;
}

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

  const [oficinas, setOficinas] = useState<Oficina[]>(() => [oficinaVacia()]);
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

  function cambiarOficina(indice: number, campo: "codigo" | "nombre", valor: string) {
    setOficinas((previo) =>
      previo.map((o, i) => (i === indice ? { ...o, [campo]: valor } : o)),
    );
    limpiarError("oficinas");
    limpiarError(`oficinas.${indice}.${campo}`);
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

  /** Errores del paso indicado, con los esquemas compartidos con el servidor. */
  function validarPaso(indice: number): Record<string, string> {
    if (indice === 0) {
      const r = esquemaDatosCompania.safeParse({
        nit,
        digitoVerificacion: dv,
        razonSocial,
        estado,
        horaCierreSesion: horaCierre,
      });
      return r.success ? {} : erroresDeZod(r.error);
    }

    if (indice === 1) {
      const r = esquemaOficinasNuevas.safeParse(oficinas);
      return r.success ? {} : erroresDeZod(r.error, "oficinas");
    }

    const r = esquemaAdministradoresNuevos.safeParse(administradores);
    return r.success ? {} : erroresDeZod(r.error, "administradores");
  }

  function siguiente() {
    const fallos = validarPaso(paso);
    if (Object.keys(fallos).length > 0) {
      setErrores(fallos);
      setMensaje("Revisa los campos marcados.");
      return;
    }
    setErrores({});
    setMensaje(null);
    setPaso(paso + 1);
  }

  function guardar() {
    const fallos = validarPaso(2);
    if (Object.keys(fallos).length > 0) {
      setErrores(fallos);
      setMensaje("Revisa los campos marcados.");
      return;
    }

    setErrores({});
    setMensaje(null);

    iniciar(async () => {
      const resultado = await crearCompania({
        nit,
        digitoVerificacion: dv,
        razonSocial,
        estado,
        horaCierreSesion: horaCierre,
        // Sin el `id`, que es solo la key de React.
        oficinas: oficinas.map(({ codigo, nombre }) => ({ codigo, nombre })),
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

  const indicadorPasos = (
    <ol className="mt-3 flex gap-2">
      {PASOS.map((titulo, i) => (
        <li
          key={titulo}
          className={cn(
            "flex-1 rounded-full border px-1.5 py-1 text-center text-[11px] leading-tight font-medium sm:px-2",
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
  );

  const pie = (
    <>
      <button
        type="button"
        onClick={() => (paso === 0 ? onCerrar() : setPaso(paso - 1))}
        disabled={enviando}
        className={BOTON_SECUNDARIO}
      >
        {paso === 0 ? "Cancelar" : "Atrás"}
      </button>

      {paso < PASOS.length - 1 ? (
        <button type="button" onClick={siguiente} className={BOTON_PRIMARIO}>
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
    </>
  );

  return (
    <DialogoFormulario
      etiqueta="Gestión de Compañías"
      titulo="Nueva compañía"
      encabezadoExtra={indicadorPasos}
      pie={pie}
      clasePie="sm:justify-between"
      onCerrar={onCerrar}
      bloqueado={enviando}
    >
      {paso === 0 ? (
        <>
          <Campo etiqueta="NIT" error={errores.nit}>
            <input
              className={CLASE_CAMPO}
              inputMode="numeric"
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
                // -mr-2 para que el área táctil de 44px no desalinee el texto
                // con el borde derecho del campo.
                className="-mr-2 inline-flex min-h-11 items-center px-2 text-[11px] font-medium text-want-navy underline"
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
            La compañía necesita al menos una oficina: es obligatoria para los
            roles Líder y Gestor.
          </p>

          {oficinas.map((oficina, i) => (
            <div key={oficina.id} className="flex items-end gap-2">
              {/* Apilados en móvil: en una fila, "Nombre" quedaba más angosto
                  que "Código" y los nombres son los textos largos. */}
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[8rem_1fr] sm:gap-2">
                <Campo etiqueta="Código" error={errores[`oficinas.${i}.codigo`]}>
                  <input
                    className={CLASE_CAMPO}
                    placeholder="NORTE"
                    value={oficina.codigo}
                    onChange={(e) => cambiarOficina(i, "codigo", e.target.value)}
                  />
                </Campo>

                <Campo etiqueta="Nombre" error={errores[`oficinas.${i}.nombre`]}>
                  <input
                    className={CLASE_CAMPO}
                    placeholder="Norte"
                    value={oficina.nombre}
                    onChange={(e) => cambiarOficina(i, "nombre", e.target.value)}
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
                className="mb-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted disabled:opacity-40"
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
            onClick={() => setOficinas((previo) => [...previo, oficinaVacia()])}
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

          {/* key por índice a propósito: son exactamente dos y no se agregan
              ni se quitan, así que el índice sí es una identidad estable. */}
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
                onCambiar={(campo, valor) => cambiarAdministrador(i, campo, valor)}
              />
            </fieldset>
          ))}
        </>
      ) : null}

      <ErrorGeneral mensaje={mensaje} />
    </DialogoFormulario>
  );
}
