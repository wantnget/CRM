import { cn } from "@/lib/utils";
import { formatearCantidad } from "@/lib/formato";
import { ETAPAS } from "@/components/consulta/etapas-embudo";
import type { EmbudoProducto } from "@/lib/consultas/embudo";

/**
 * Una tarjeta por producto: las cuatro etapas con su mini barra y su conteo.
 *
 * El riel de cada barra representa el total del producto, así que las cuatro
 * barras de una tarjeta son comparables entre sí pero no contra otra tarjeta.
 * El conteo va siempre impreso al lado, que es lo que hace legible la
 * comparación y lo que permite usar los colores de marca en la barra.
 */
export function TarjetaEmbudo({ producto }: { producto: EmbudoProducto }) {
  const { productoNombre, conteos, total, activas } = producto;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          {productoNombre}
        </p>
        <p className="shrink-0 text-xs text-muted-foreground">
          {formatearCantidad(total)} en total
        </p>
      </div>

      <div className="flex-1 space-y-2">
        {ETAPAS.map((etapa) => {
          const valor = conteos[etapa.id];
          const ancho = total > 0 ? (valor / total) * 100 : 0;

          return (
            <div key={etapa.id} className="flex items-center gap-3">
              <span
                className={cn(
                  "w-28 shrink-0 text-[11px] font-medium",
                  etapa.texto,
                )}
              >
                {etapa.etiqueta}
              </span>

              <div
                className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"
                title={`${etapa.etiqueta}: ${formatearCantidad(valor)}`}
              >
                <div
                  className={cn("h-full rounded-full", etapa.fondo)}
                  style={{ width: `${ancho}%` }}
                />
              </div>

              <span className="w-6 shrink-0 text-right text-xs font-medium tabular-nums">
                {formatearCantidad(valor)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        {formatearCantidad(activas)} activa(s) en contacto u oferta
      </p>
    </div>
  );
}
