import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PillEstado } from "@/components/prospeccion/pill-estado";
import { cn } from "@/lib/utils";
import { formatearValor, inicialesDe } from "@/lib/formato";
import type { ItemBandeja as Item } from "@/lib/consultas/bandeja";

/**
 * Una fila de la bandeja de prospección (CRM.docx §7.3).
 *
 * Sigue el patrón de la bandeja de correo: avatar, nombre y detalle apilados,
 * con el borde izquierdo marcando la selección. No es una tabla porque a la
 * derecha va el cuadro de gestión y no queda ancho para columnas.
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
          "flex items-start gap-3 border-b border-l-2 border-border px-4 py-3.5 transition",
          seleccionado
            ? "border-l-want-naranja bg-want-naranja/5"
            : "border-l-transparent hover:bg-muted/50",
        )}
      >
        <Avatar size="sm" className="mt-0.5">
          <AvatarFallback className="bg-want-navy/10 text-want-navy">
            {inicialesDe(item.asociadoNombre)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {item.asociadoNombre}
            </p>

            {/* El valor se diligencia al pasar a oferta: en contacto no existe. */}
            <span className="shrink-0 text-sm font-medium text-foreground">
              {item.valor === null
                ? ""
                : formatearValor(item.valor, item.unidadMedida)}
            </span>
          </div>

          <p className="truncate text-xs text-muted-foreground">
            ID {item.asociadoIdentificacion} · {item.oficinaNombre}
          </p>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">
              {item.productoNombre}
            </p>
            <PillEstado estado={item.estado} />
          </div>
        </div>
      </Link>
    </li>
  );
}
