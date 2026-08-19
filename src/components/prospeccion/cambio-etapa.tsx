"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
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
import { cambiarEtapa } from "@/app/crm/wantget/v1/(app)/prospeccion/acciones";

/**
 * Movimiento de etapa de la prospección.
 *
 * Es una acción explícita y no un efecto de registrar una gestión: el campo
 * `gestion.etapa` del spec es "la etapa en la que se realizó esta gestión", así
 * que anotar una llamada no debería mover el embudo. El prototipo las mezclaba
 * en un solo select.
 *
 * RN-36 dice que las etapas son estrictamente secuenciales y que no se puede
 * retroceder. Por ahora se permite volver a Contacto, como en el prototipo, y
 * el diálogo lo advierte; queda pendiente de confirmar con negocio.
 *
 * El valor se pide al pasar a Oferta, que es cuando se presentan "condiciones,
 * monto, plazo y beneficios", y se puede corregir después mientras siga abierta.
 */

const BOTON_CHICO =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition disabled:opacity-50";

type Modo = "oferta" | "valor" | null;

export function CambioEtapa({ detalle }: { detalle: DetalleProspeccion }) {
  const [modo, setModo] = useState<Modo>(null);
  const [volviendo, setVolviendo] = useState(false);
  const [pendiente, iniciar] = useTransition();

  if (detalle.cerrada) return null;

  function volverAContacto() {
    iniciar(async () => {
      await cambiarEtapa({
        oportunidadId: detalle.oportunidadId,
        etapa: "CONTACTO",
        valor: null,
      });
      setVolviendo(false);
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className={cn(CLASE_ETIQUETA, "mr-1")}>Etapa</span>

      {detalle.etapa === "CONTACTO" ? (
        <button
          type="button"
          onClick={() => setModo("oferta")}
          disabled={pendiente}
          className={cn(BOTON_CHICO, "border-want-navy/25 hover:bg-muted")}
        >
          Pasar a Oferta
          <ArrowRight className="size-3.5" />
        </button>
      ) : null}

      {detalle.etapa === "OFERTA" ? (
        <>
          <button
            type="button"
            onClick={() => setModo("valor")}
            disabled={pendiente}
            className={cn(BOTON_CHICO, "border-want-navy/25 hover:bg-muted")}
          >
            <Pencil className="size-3.5" />
            {detalle.valor === null
              ? "Indicar valor ofertado"
              : `Valor ofertado: ${formatearValor(detalle.valor, detalle.unidadMedida)}`}
          </button>

          <button
            type="button"
            onClick={() => setVolviendo(true)}
            disabled={pendiente}
            className={cn(BOTON_CHICO, "border-border text-muted-foreground hover:bg-muted")}
          >
            <ArrowLeft className="size-3.5" />
            Volver a Contacto
          </button>
        </>
      ) : null}

      <Confirmacion
        abierto={volviendo}
        pendiente={pendiente}
        titulo="Volver a Contacto"
        textoConfirmar="Volver a Contacto"
        descripcion={
          <>
            La prospección regresará a la etapa de contacto. El valor ofertado se
            conserva. Ten en cuenta que la especificación (RN-36) define las
            etapas como secuenciales sin retroceso, así que esto está pendiente
            de confirmar con negocio.
          </>
        }
        onCancelar={() => setVolviendo(false)}
        onConfirmar={volverAContacto}
      />

      {modo ? (
        <DialogValor
          detalle={detalle}
          modo={modo}
          onCerrar={() => setModo(null)}
        />
      ) : null}
    </div>
  );
}

/** Se monta solo al abrir, así el estado arranca del valor vigente. */
function DialogValor({
  detalle,
  modo,
  onCerrar,
}: {
  detalle: DetalleProspeccion;
  modo: "oferta" | "valor";
  onCerrar: () => void;
}) {
  const [valor, setValor] = useState(() =>
    detalle.valor === null ? "" : String(detalle.valor),
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const pasandoAOferta = modo === "oferta";

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrores({});
    setMensaje(null);

    iniciar(async () => {
      const resultado: ResultadoAccion = await cambiarEtapa({
        oportunidadId: detalle.oportunidadId,
        etapa: "OFERTA",
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
            {pasandoAOferta ? "Pasar a Oferta" : "Valor de la oferta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar}>
          <div className="space-y-5 px-6 py-6">
            <CampoValor
              etiqueta={
                detalle.unidadMedida === "MONTO"
                  ? "Monto ofertado"
                  : "Cantidad ofertada"
              }
              unidadMedida={detalle.unidadMedida}
              valor={valor}
              onCambiar={setValor}
              error={errores.valor}
              autoFocus
            />

            {pasandoAOferta ? (
              <p className="text-xs text-muted-foreground">
                Al cerrar la venta se confirma este valor, que puede cambiar por
                la negociación.
              </p>
            ) : null}

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
              {enviando
                ? "Guardando..."
                : pasandoAOferta
                  ? "Pasar a Oferta"
                  : "Guardar valor"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
