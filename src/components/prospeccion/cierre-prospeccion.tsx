"use client";

import { useState, useTransition } from "react";
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
  CLASE_ETIQUETA,
  ErrorGeneral,
} from "@/components/form/campos";
import { CampoValor } from "@/components/prospeccion/campo-valor";
import { Confirmacion } from "@/components/confirmacion";
import { cn } from "@/lib/utils";
import { formatearValor } from "@/lib/formato";
import type { DetalleProspeccion } from "@/lib/consultas/detalle";
import type { ResultadoAccion } from "@/lib/validaciones/usuario";
import { cerrarProspeccion } from "@/app/crm/wantget/v1/(app)/prospeccion/acciones";

/**
 * Cierre de la prospección (RN-37).
 *
 * El cierre es irreversible: RN-38 deja la oportunidad de solo lectura y RN-41
 * dice que una No Venta se retoma abriendo una oportunidad nueva, nunca
 * editando esta. Por eso las dos opciones piden confirmación y después los
 * botones quedan inertes.
 *
 * "Iniciar venta asistida" queda visible y deshabilitada: CRM.docx §7.3 la
 * menciona como "flujo pendiente de construcción", igual que Pago Variable.
 */

const BASE = "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const ETIQUETA_RESULTADO = {
  VENTA: "Finaliza – Venta",
  NO_VENTA: "Finaliza – No Venta",
} as const;

export function CierreProspeccion({
  detalle,
}: {
  detalle: DetalleProspeccion;
}) {
  const [confirmandoNoVenta, setConfirmandoNoVenta] = useState(false);
  const [confirmandoVenta, setConfirmandoVenta] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const cerrada = detalle.cerrada;

  const estadoActual = cerrada
    ? detalle.resultadoCierre
      ? ETIQUETA_RESULTADO[detalle.resultadoCierre]
      : "Cerrada"
    : detalle.etapa === "OFERTA"
      ? "Oferta"
      : "Contacto";

  function cerrarSinVenta() {
    iniciar(async () => {
      await cerrarProspeccion({
        oportunidadId: detalle.oportunidadId,
        resultado: "NO_VENTA",
        valor: null,
      });
      setConfirmandoNoVenta(false);
    });
  }

  return (
    <section>
      <p className={CLASE_ETIQUETA}>Cierre de la prospección</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={cerrada || pendiente}
          onClick={() => setConfirmandoVenta(true)}
          className={cn(BASE, "bg-want-verde text-white hover:brightness-95")}
        >
          Finaliza – Venta
        </button>

        <button
          type="button"
          disabled={cerrada || pendiente}
          onClick={() => setConfirmandoNoVenta(true)}
          className={cn(
            BASE,
            "border border-want-rojo/40 text-want-rojo hover:bg-want-rojo/5",
          )}
        >
          Finaliza – No Venta
        </button>

        <button
          type="button"
          disabled
          title="Flujo pendiente de construcción (CRM.docx §7.3)"
          className={cn(BASE, "border border-border text-muted-foreground")}
        >
          Iniciar venta asistida
          <span className="ml-1.5 rounded border border-current px-1 text-[10px] leading-4">
            V2
          </span>
        </button>

        <p className="text-sm text-muted-foreground">
          Estado actual:{" "}
          <strong className="font-semibold text-foreground">
            {estadoActual}
          </strong>
        </p>
      </div>

      {cerrada ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Una prospección cerrada no se modifica. Para retomar este producto con
          el asociado, abre una nueva prospección.
        </p>
      ) : null}

      <Confirmacion
        abierto={confirmandoNoVenta}
        peligroso
        pendiente={pendiente}
        titulo="Cerrar como Finaliza – No Venta"
        textoConfirmar="Cerrar sin venta"
        descripcion={
          <>
            <strong className="text-foreground">
              {detalle.asociadoNombre}
            </strong>{" "}
            no aceptó {detalle.productoNombre}. La prospección quedará cerrada y
            de solo lectura; para retomarla habría que abrir una nueva.
          </>
        }
        onCancelar={() => setConfirmandoNoVenta(false)}
        onConfirmar={cerrarSinVenta}
      />

      {/* Se monta solo al abrir, así el valor arranca del ofertado. */}
      {confirmandoVenta ? (
        <DialogVenta
          detalle={detalle}
          onCerrar={() => setConfirmandoVenta(false)}
        />
      ) : null}
    </section>
  );
}

function DialogVenta({
  detalle,
  onCerrar,
}: {
  detalle: DetalleProspeccion;
  onCerrar: () => void;
}) {
  const [valor, setValor] = useState(() =>
    detalle.valor === null ? "" : String(detalle.valor),
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrores({});
    setMensaje(null);

    iniciar(async () => {
      const resultado: ResultadoAccion = await cerrarProspeccion({
        oportunidadId: detalle.oportunidadId,
        resultado: "VENTA",
        valor: valor.trim() === "" ? null : Number(valor),
      });

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
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <p className={CLASE_ETIQUETA}>{detalle.productoNombre}</p>
          <DialogTitle className="text-xl font-semibold text-want-navy">
            Finaliza – Venta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar}>
          <div className="space-y-5 px-6 py-6">
            <CampoValor
              etiqueta={
                detalle.unidadMedida === "MONTO"
                  ? "Monto vendido"
                  : "Cantidad vendida"
              }
              unidadMedida={detalle.unidadMedida}
              valor={valor}
              onCambiar={setValor}
              error={errores.valor}
              autoFocus
            />

            <p className="text-xs text-muted-foreground">
              {detalle.valor === null
                ? "Es el valor que suma a los resultados comerciales del periodo."
                : `Se ofertó ${formatearValor(detalle.valor, detalle.unidadMedida)}. Confírmalo o corrígelo si la negociación lo cambió.`}
            </p>

            <p className="rounded-lg bg-want-naranja/10 px-3 py-2 text-xs text-amber-800">
              Al cerrar, la prospección queda de solo lectura y la venta se
              imputa al mes del cierre.
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
              disabled={enviando}
              className={BOTON_PRIMARIO}
            >
              {enviando ? "Cerrando..." : "Cerrar como venta"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
