import { formatoPorUnidadMedida } from "@/lib/formato";
import type { ResultadoProducto } from "@/lib/consulta-general";

/**
 * "Presupuesto vs. Real por producto" (CRM.docx §5.2 / §6.2 / §7.2).
 *
 * El umbral del layout es consulta de contenedor (@2xl = 42rem) y no media
 * query: el sidebar se queda con 256px desde md, así que a 768px de viewport
 * este panel tiene 448px reales. Con un md: recibiría el layout de fila, que
 * pide 416px de mínimo, y las barras quedarían en 30px. Es el mismo umbral que
 * usa la vista de tarjetas de DataTable.
 *
 * Los tonos de los rótulos no son los de las barras: #F59E0B sobre blanco da
 * 2,1:1 y no cumple AA, así que la etiqueta usa un ámbar más oscuro (5,02:1) y
 * la de presupuesto un gris de 4,76:1. La barra sí conserva el color de marca,
 * que es donde el color comunica.
 */

type ResultadosComercialesProps = {
  resultados: ResultadoProducto[];
  alcance: string;
};

function colorCumplimiento(cumplimiento: number | null) {
  if (cumplimiento === null) return "text-muted-foreground";
  // #22C55E sobre blanco da 2,0:1; el emerald oscuro cumple AA incluso en
  // texto grande, y el rojo de marca ya pasa con 4,83:1.
  return cumplimiento >= 100 ? "text-emerald-700" : "text-want-rojo";
}

function FilaProducto({ resultado }: { resultado: ResultadoProducto }) {
  const anchoReal =
    resultado.presupuesto > 0
      ? Math.min((resultado.real / resultado.presupuesto) * 100, 100)
      : 0;

  const brecha = resultado.presupuesto - resultado.real;
  const textoBrecha =
    resultado.presupuesto === 0
      ? "Sin presupuesto cargado"
      : brecha > 0
        ? `− ${formatoPorUnidadMedida(brecha, resultado.unidadMedida)} por cumplir`
        : "Meta cumplida";

  return (
    <div className="flex flex-col gap-4 border-b border-border py-5 last:border-b-0 @2xl:flex-row @2xl:items-center @2xl:gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-want-navy">{resultado.nombre}</p>

        <div className="mt-3 flex items-center gap-3">
          <span className="w-20 shrink-0 text-[11px] font-semibold tracking-wide text-amber-700 uppercase @2xl:w-24">
            Real
          </span>
          <div className="h-3 flex-1 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-want-naranja transition-[width] duration-700 ease-out"
              style={{ width: `${anchoReal}%` }}
            />
          </div>
          <span className="w-28 shrink-0 text-right text-sm font-medium text-foreground">
            {formatoPorUnidadMedida(resultado.real, resultado.unidadMedida)}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <span className="w-20 shrink-0 text-[11px] font-semibold tracking-wide text-slate-500 uppercase @2xl:w-24">
            Presupuesto
          </span>
          <div className="h-3 flex-1 rounded-full bg-muted">
            <div className="h-full w-full rounded-full bg-slate-400" />
          </div>
          <span className="w-28 shrink-0 text-right text-sm font-medium text-foreground">
            {formatoPorUnidadMedida(resultado.presupuesto, resultado.unidadMedida)}
          </span>
        </div>
      </div>

      <div className="w-full shrink-0 rounded-lg border border-border px-4 py-3 @2xl:w-40 @2xl:text-center">
        <div className="flex items-baseline justify-between gap-3 @2xl:block">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Cumplimiento
          </p>
          <p className={`text-2xl font-bold @2xl:mt-1 ${colorCumplimiento(resultado.cumplimiento)}`}>
            {resultado.cumplimiento === null ? "—" : `${resultado.cumplimiento}%`}
          </p>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{textoBrecha}</p>
      </div>
    </div>
  );
}

export function ResultadosComerciales({ resultados, alcance }: ResultadosComercialesProps) {
  return (
    <div className="@container overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-want-navy px-5 py-3 text-white">
        <p className="text-sm font-semibold">Presupuesto vs. Real por producto</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-3 rounded-full bg-want-naranja" />
            Real
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-3 rounded-full bg-slate-400" />
            Presupuesto
          </span>
          <span className="text-white/70">{alcance}</span>
        </div>
      </div>

      <div className="px-5">
        {resultados.map((resultado) => (
          <FilaProducto key={resultado.codigo} resultado={resultado} />
        ))}
      </div>
    </div>
  );
}
