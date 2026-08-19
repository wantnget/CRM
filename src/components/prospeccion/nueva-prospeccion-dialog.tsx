"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
  CLASE_CAMPO,
  CLASE_ETIQUETA,
  Campo,
  ErrorGeneral,
} from "@/components/form/campos";
import { crearProspeccion } from "@/app/crm/wantget/v1/(app)/prospeccion/acciones";
import type { ResultadoAccion } from "@/lib/validaciones/usuario";

/**
 * Alta de una prospección (CRM.docx §7.3).
 *
 * Tres decisiones que se apartan del prototipo, todas por reglas del spec:
 *
 * - El asociado se elige de un desplegable, no se escribe su ID. Solo aparecen
 *   los que el Líder le asignó a este gestor y siguen vigentes (RN-32), así que
 *   la regla se cumple por construcción y no solo por validación.
 * - Los canales se limitan a los habilitados para el gestor (RN-17 / RN-44). El
 *   prototipo mostraba los cuatro; acá, si no tiene ninguno, se explica por qué
 *   en vez de dejar un desplegable vacío.
 * - No se pide etapa: toda prospección arranca en Contacto (RN-36).
 *
 * La action revalida las tres cosas: el desplegable filtra por comodidad, no
 * por seguridad.
 */

export type AsociadoOpcion = {
  id: string;
  nombreCompleto: string;
  numeroIdentificacion: string;
};

export type ProductoOpcion = { codigo: string; nombre: string };
export type CanalOpcion = { codigo: string; nombre: string };

const CLASE_NOTA =
  "rounded-lg bg-want-naranja/10 px-3 py-2 text-sm text-amber-800";

const CLASE_AREA =
  "min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-want-navy focus:ring-2 focus:ring-want-navy/20 disabled:bg-muted disabled:text-muted-foreground";

type Estado = {
  asociadoId: string;
  productoCodigo: string;
  canalCodigo: string;
  observacion: string;
};

function sinCampo(errores: Record<string, string>, campo: string) {
  if (!(campo in errores)) return errores;
  const copia = { ...errores };
  delete copia[campo];
  return copia;
}

/**
 * Se monta solo mientras está abierto (ver NuevaProspeccion), así el estado
 * inicial se calcula en el montaje y no hace falta un efecto que lo
 * resincronice.
 */
function Formulario({
  onCerrar,
  asociados,
  productos,
  canales,
}: {
  onCerrar: () => void;
  asociados: AsociadoOpcion[];
  productos: ProductoOpcion[];
  canales: CanalOpcion[];
}) {
  const [datos, setDatos] = useState<Estado>({
    asociadoId: "",
    // El producto sí puede venir preseleccionado: la lista es fija y siempre
    // tiene elementos. El asociado y el canal no, porque pueden estar vacíos.
    productoCodigo: productos[0]?.codigo ?? "",
    canalCodigo: canales.length === 1 ? canales[0].codigo : "",
    observacion: "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const sinAsociados = asociados.length === 0;
  const sinCanales = canales.length === 0;
  const bloqueado = sinAsociados || sinCanales;

  function cambiar<K extends keyof Estado>(campo: K, valor: Estado[K]) {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => sinCampo(previo, campo as string));
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrores({});
    setMensaje(null);

    iniciarEnvio(async () => {
      const resultado: ResultadoAccion = await crearProspeccion(datos);

      if (resultado.ok) {
        onCerrar();
        return;
      }
      setErrores(resultado.errores ?? {});
      setMensaje(resultado.mensaje);
    });
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <p className={CLASE_ETIQUETA}>Prospección</p>
          <DialogTitle className="text-xl font-semibold text-want-navy">
            Nueva prospección
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar}>
          <div className="space-y-5 px-6 py-6">
            <Campo
              etiqueta="Asociado"
              error={errores.asociadoId}
              ayuda={
                sinAsociados
                  ? undefined
                  : "Solo aparecen los asociados que tu Líder te asignó."
              }
            >
              {sinAsociados ? (
                <p className={CLASE_NOTA}>
                  No tienes asociados asignados. Tu Líder debe asignarte
                  asociados antes de que puedas abrir una prospección.
                </p>
              ) : (
                <select
                  className={CLASE_CAMPO}
                  value={datos.asociadoId}
                  onChange={(e) => cambiar("asociadoId", e.target.value)}
                  required
                >
                  <option value="">Selecciona un asociado</option>
                  {asociados.map((asociado) => (
                    <option key={asociado.id} value={asociado.id}>
                      {asociado.nombreCompleto} — {asociado.numeroIdentificacion}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo etiqueta="Producto" error={errores.productoCodigo}>
              <select
                className={CLASE_CAMPO}
                value={datos.productoCodigo}
                onChange={(e) => cambiar("productoCodigo", e.target.value)}
                disabled={bloqueado}
                required
              >
                {productos.map((producto) => (
                  <option key={producto.codigo} value={producto.codigo}>
                    {producto.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo
              etiqueta="Canal del primer contacto"
              error={errores.canalCodigo}
              ayuda={
                sinCanales
                  ? undefined
                  : "Queda registrado como la primera gestión de la prospección."
              }
            >
              {sinCanales ? (
                <p className={CLASE_NOTA}>
                  No tienes canales de comunicación habilitados. El Administrador
                  de tu compañía los habilita desde la pantalla de Usuarios.
                </p>
              ) : (
                <select
                  className={CLASE_CAMPO}
                  value={datos.canalCodigo}
                  onChange={(e) => cambiar("canalCodigo", e.target.value)}
                  disabled={sinAsociados}
                  required
                >
                  <option value="">Selecciona un canal</option>
                  {canales.map((canal) => (
                    <option key={canal.codigo} value={canal.codigo}>
                      {canal.nombre}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo
              etiqueta="Observación"
              error={errores.observacion}
              ayuda="Opcional."
            >
              <textarea
                className={CLASE_AREA}
                placeholder="Qué se conversó en el primer contacto."
                value={datos.observacion}
                onChange={(e) => cambiar("observacion", e.target.value)}
                disabled={bloqueado}
                maxLength={2000}
              />
            </Campo>

            {/* La etapa no se pide: RN-36 obliga a empezar en Contacto. */}
            <p className="text-xs text-muted-foreground">
              La prospección se abre en etapa <strong>Contacto</strong>. La
              oferta y el cierre se registran desde su detalle.
            </p>

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
            <button
              type="submit"
              disabled={enviando || bloqueado}
              className={BOTON_PRIMARIO}
            >
              {enviando ? "Abriendo..." : "Abrir prospección"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Botón de alta y su diálogo. */
export function NuevaProspeccion({
  asociados,
  productos,
  canales,
}: {
  asociados: AsociadoOpcion[];
  productos: ProductoOpcion[];
  canales: CanalOpcion[];
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-want-naranja px-4 text-sm font-semibold text-want-navy transition hover:brightness-95"
      >
        <Plus className="size-4" />
        Nueva prospección
      </button>

      {abierto ? (
        <Formulario
          onCerrar={() => setAbierto(false)}
          asociados={asociados}
          productos={productos}
          canales={canales}
        />
      ) : null}
    </>
  );
}
