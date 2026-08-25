import Link from "next/link";
import { PillEstado } from "@/components/prospeccion/pill-estado";
import { cn } from "@/lib/utils";
import { formatearValor } from "@/lib/formato";
import type { ItemBandeja as Item } from "@/lib/consultas/bandeja";

/**
 * Una fila de la bandeja de prospección (CRM.docx §7.3).
 *
 * No es una tabla: cada ítem es una tarjeta apilada, porque en el prototipo la
 * bandeja convive con el cuadro de gestión a la derecha y no le queda ancho para
 * columnas. Por eso tampoco usa DataTable.
 *
 * La selección va por URL y no por estado local, igual que el filtro: el enlace
 * a una prospección concreta se puede compartir y el botón de atrás funciona.
 */
export function ItemBandeja({
  item,
  href,
  seleccionado,
}: {
  item: Item;
  href: string;
  seleccionado: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        aria-current={seleccionado ? "true" : undefined}
        className={cn(
          "block border-b border-l-2 border-border px-5 py-4 transition",
          seleccionado
            ? "border-l-want-naranja bg-want-naranja/5"
            : "border-l-transparent hover:bg-muted/50",
        )}
      >
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

        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            {item.productoNombre}
          </p>

          {/* El valor se diligencia al pasar a oferta: en contacto no existe. */}
          <p className="shrink-0 text-sm font-medium text-foreground">
            {item.valor === null
              ? ""
              : formatearValor(item.valor, item.unidadMedida)}
          </p>
        </div>
      </Link>
    </li>
  );
}
