"use client";

import { CLASE_CAMPO, Campo } from "@/components/form/campos";
import { cn } from "@/lib/utils";
import { formatearValor, type UnidadMedida } from "@/lib/formato";

/**
 * Campo del valor de una oportunidad.
 *
 * La unidad la manda el producto: Colocación y CDAT se miden en pesos, el resto
 * en unidades (RN-56 prohíbe mezclarlas en cualquier total). En pesos se muestra
 * el prefijo y una vista previa formateada, porque un número largo sin
 * separadores es fácil de teclear mal.
 */
export function CampoValor({
  etiqueta,
  unidadMedida,
  valor,
  onCambiar,
  error,
  autoFocus,
}: {
  etiqueta: string;
  unidadMedida: UnidadMedida;
  /** Cadena y no número: un input vacío no es cero. */
  valor: string;
  onCambiar: (valor: string) => void;
  error?: string;
  autoFocus?: boolean;
}) {
  const esMonto = unidadMedida === "MONTO";
  const numero = Number(valor);
  const previa =
    valor.trim() !== "" && Number.isFinite(numero) && numero > 0
      ? formatearValor(numero, unidadMedida)
      : null;

  return (
    <Campo
      etiqueta={etiqueta}
      error={error}
      ayuda={
        previa ? (
          <>
            Se registrará como <strong>{previa}</strong>.
          </>
        ) : esMonto ? (
          "Monto en pesos, sin puntos ni decimales."
        ) : (
          "Cantidad en unidades, número entero."
        )
      }
    >
      <div className="relative">
        {esMonto ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
          >
            $
          </span>
        ) : null}

        <input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          className={cn(CLASE_CAMPO, esMonto && "pl-7")}
          value={valor}
          onChange={(evento) => onCambiar(evento.target.value)}
          autoFocus={autoFocus}
          required
        />
      </div>
    </Campo>
  );
}
