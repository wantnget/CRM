import { cn } from "@/lib/utils";
import type { DetalleProspeccion } from "@/lib/consultas/detalle";

/**
 * Las tres etapas de la prospección como tarjetas (CRM.docx §7.3).
 *
 * El color no es el del embudo: allá cada etapa tiene identidad propia, y acá
 * lo que se comunica es avance. Verde lo recorrido, naranja donde está, gris lo
 * pendiente. La única excepción es la tarjeta de cierre de una prospección
 * cerrada, que toma el color del resultado y ahí sí coincide con el embudo.
 */

const ETAPAS = [
  {
    id: "CONTACTO" as const,
    etiqueta: "Contacto",
    descripcion: "Primer acercamiento y validación de interés del asociado.",
  },
  {
    id: "OFERTA" as const,
    etiqueta: "Oferta",
    descripcion: "Presentación de condiciones, monto, plazo y beneficios.",
  },
  {
    id: "CIERRE" as const,
    etiqueta: "Cierre",
    descripcion: "Pendiente de decisión del asociado.",
  },
];

const RECORRIDA = {
  tarjeta: "border-want-verde/30 bg-want-verde/5",
  numero: "bg-want-verde text-white",
};
const ACTUAL = {
  tarjeta: "border-want-naranja/40 bg-want-naranja/10",
  numero: "bg-want-naranja text-want-navy",
};
const PENDIENTE = {
  tarjeta: "border-border bg-muted/40",
  numero: "bg-muted-foreground/25 text-muted-foreground",
};
const NO_VENTA = {
  tarjeta: "border-want-rojo/30 bg-want-rojo/5",
  numero: "bg-want-rojo text-white",
};

export function EtapasProspeccion({
  detalle,
}: {
  detalle: DetalleProspeccion;
}) {
  const actual = ETAPAS.findIndex((e) => e.id === detalle.etapa);

  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {ETAPAS.map((etapa, indice) => {
        const esActual = indice === actual;
        const cerrada = detalle.cerrada && etapa.id === "CIERRE";

        const estilo = cerrada
          ? detalle.resultadoCierre === "NO_VENTA"
            ? NO_VENTA
            : RECORRIDA
          : indice < actual
            ? RECORRIDA
            : esActual
              ? ACTUAL
              : PENDIENTE;

        const descripcion = cerrada
          ? `Cerrada como Finaliza – ${
              detalle.resultadoCierre === "NO_VENTA" ? "No Venta" : "Venta"
            }.`
          : etapa.descripcion;

        return (
          <li
            key={etapa.id}
            aria-current={esActual ? "step" : undefined}
            className={cn("rounded-xl border p-4", estilo.tarjeta)}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  estilo.numero,
                )}
              >
                {indice + 1}
              </span>
              <p className="text-sm font-semibold text-want-navy">
                {etapa.etiqueta}
              </p>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {descripcion}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
