import { cn } from "@/lib/utils";
import { formatearValor } from "@/lib/formato";
import type { ResultadoProducto } from "@/lib/consultas/resultados";

/**
 * Un producto del comparativo Presupuesto vs. Real.
 *
 * Decisiones de la visualización:
 *
 * - Una sola serie de identidad, "Real", en el naranja corporativo. "Presupuesto"
 *   es una marca de referencia, no una segunda identidad: por eso va en un
 *   neutro y se mantiene recesiva.
 * - El riel representa `max(real, presupuesto)`, así que cuando se supera la
 *   meta la barra naranja llega al final y la de referencia se encoge. Es lo que
 *   hace el prototipo y evita tener que recortar la barra al 100%.
 * - Los dos valores van siempre impresos al lado. Además de ser el dato que se
 *   viene a leer, es lo que permite usar el naranja de marca pese a que su
 *   contraste sobre blanco queda por debajo de 3:1.
 * - Verde y rojo se reservan al estado de cumplimiento y nunca se usan como
 *   color de serie, y siempre acompañados de texto: el color no es el único
 *   portador del significado.
 * - Las etiquetas "Real" y "Presupuesto" van teñidas, pero NO con el color de
 *   la barra: el naranja de marca da 2.15:1 sobre blanco y sería ilegible en
 *   texto de 11px. Se usan tonos más oscuros de la misma familia que superan
 *   AA (amber-700 a 5.02:1 y slate-500 a 4.76:1). El color de marca se queda en
 *   la barra, que es donde no tiene que leerse.
 */

function anchoPorcentaje(valor: number, tope: number) {
  if (tope <= 0) return 0;
  return Math.min(100, (valor / tope) * 100);
}

function Barra({
  etiqueta,
  ancho,
  clase,
  claseEtiqueta,
  titulo,
}: {
  etiqueta: string;
  ancho: number;
  clase: string;
  claseEtiqueta: string;
  titulo: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "w-24 shrink-0 text-[11px] font-semibold tracking-wide uppercase",
          claseEtiqueta,
        )}
      >
        {etiqueta}
      </span>
      <div
        className="h-3 flex-1 overflow-hidden rounded-full bg-muted"
        title={titulo}
      >
        <div
          className={cn("h-full rounded-full transition-[width]", clase)}
          style={{ width: `${ancho}%` }}
        />
      </div>
    </div>
  );
}

/** Texto que acompaña al porcentaje: cuánto falta o cuánto se superó. */
function detalleCumplimiento(resultado: ResultadoProducto) {
  const { real, meta, unidadMedida } = resultado;
  if (meta === null) return "Sin meta asignada";

  const diferencia = real - meta;
  if (diferencia === 0) return "En la meta";

  const magnitud = formatearValor(Math.abs(diferencia), unidadMedida);
  return diferencia < 0 ? `−${magnitud} por cumplir` : `+${magnitud} sobre meta`;
}

export function BarraProducto({ resultado }: { resultado: ResultadoProducto }) {
  const { productoNombre, real, meta, unidadMedida, cumplimiento } = resultado;

  const tope = Math.max(real, meta ?? 0);
  const cumplida = cumplimiento !== null && cumplimiento >= 100;

  const realTexto = formatearValor(real, unidadMedida);
  const metaTexto = meta === null ? "—" : formatearValor(meta, unidadMedida);

  return (
    <div className="flex flex-col gap-4 border-b border-border px-6 py-6 last:border-b-0 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <p className="mb-3 text-sm font-semibold text-foreground">
          {productoNombre}
        </p>

        <div className="space-y-2.5">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <Barra
                etiqueta="Real"
                ancho={anchoPorcentaje(real, tope)}
                clase="bg-want-naranja"
                claseEtiqueta="text-amber-700"
                titulo={`Real: ${realTexto}`}
              />
            </div>
            <span className="w-32 shrink-0 text-right text-sm font-medium tabular-nums">
              {realTexto}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <Barra
                etiqueta="Presupuesto"
                ancho={anchoPorcentaje(meta ?? 0, tope)}
                clase="bg-slate-400"
                claseEtiqueta="text-slate-500"
                titulo={`Presupuesto: ${metaTexto}`}
              />
            </div>
            <span className="w-32 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
              {metaTexto}
            </span>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 rounded-xl border px-5 py-3 text-center lg:w-44",
          meta === null
            ? "border-border bg-muted/40"
            : cumplida
              ? "border-want-verde/40 bg-want-verde/5"
              : "border-want-rojo/30 bg-want-rojo/5",
        )}
      >
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Cumplimiento
        </p>
        <p
          className={cn(
            "text-2xl font-bold",
            meta === null
              ? "text-muted-foreground"
              : cumplida
                ? "text-emerald-600"
                : "text-want-rojo",
          )}
        >
          {cumplimiento === null ? "—" : `${Math.round(cumplimiento)}%`}
        </p>
        <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
          {detalleCumplimiento(resultado)}
        </p>
      </div>
    </div>
  );
}
