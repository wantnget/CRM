import { PillEstado } from "@/components/prospeccion/pill-estado";
import { formatearValor } from "@/lib/formato";
import type { ItemBandeja as Item } from "@/lib/consultas/bandeja";

/**
 * Una fila de la bandeja de prospección (CRM.docx §7.3).
 *
 * No es una tabla: cada ítem es una tarjeta apilada, porque en el prototipo la
 * bandeja convive con el cuadro de gestión a la derecha y no le queda ancho
 * para columnas. Por eso tampoco usa DataTable.
 *
 * Todavía no navega: la selección y el detalle son la segunda parte del módulo.
 */

const FECHA = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

export function ItemBandeja({ item }: { item: Item }) {
  return (
    <li className="border-b border-border px-5 py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {item.asociadoNombre}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            ID {item.asociadoIdentificacion} · {item.oficinaNombre}
          </p>
        </div>

        <PillEstado estado={item.estado} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-xs text-muted-foreground">
          {item.productoNombre}
          {/* El valor se diligencia al pasar a oferta: en contacto no existe. */}
          {item.valor !== null ? (
            <span className="ml-1.5 font-medium text-foreground">
              {formatearValor(item.valor, item.unidadMedida)}
            </span>
          ) : null}
        </p>

        <p className="text-xs text-muted-foreground">
          {item.ultimaGestion
            ? `Última gestión ${FECHA.format(item.ultimaGestion)}`
            : "Sin gestiones"}
        </p>
      </div>
    </li>
  );
}
