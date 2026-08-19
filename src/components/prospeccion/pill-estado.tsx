import { cn } from "@/lib/utils";
import { ETAPAS } from "@/components/consulta/etapas-embudo";
import type { EstadoItem } from "@/lib/consultas/bandeja";

/**
 * Píldora de etapa de un ítem de la bandeja.
 *
 * Reutiliza la paleta del embudo para que la misma oportunidad se vea del mismo
 * color en las dos pantallas. Las etiquetas sí son más cortas: en el embudo se
 * lee "Finaliza – Venta" porque titula una columna, y acá compite por espacio
 * con el nombre del asociado.
 */

const ETIQUETAS: Record<EstadoItem, string> = {
  CONTACTO: "Contacto",
  OFERTA: "Oferta",
  VENTA: "Venta",
  NO_VENTA: "No venta",
};

/** Fondo tenue por etapa; el color pleno es demasiado para una píldora. */
const FONDOS: Record<EstadoItem, string> = {
  CONTACTO: "bg-etapa-contacto/10",
  OFERTA: "bg-etapa-oferta/15",
  VENTA: "bg-etapa-venta/10",
  NO_VENTA: "bg-etapa-no-venta/10",
};

export function PillEstado({ estado }: { estado: EstadoItem }) {
  // El tono de texto es el verificado para contraste AA en globals.css; el
  // pleno queda para el punto de color.
  const etapa = ETAPAS.find((e) => e.id === estado);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        FONDOS[estado],
        etapa?.texto,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", etapa?.fondo)} />
      {ETIQUETAS[estado]}
    </span>
  );
}
