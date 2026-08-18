import { formatoPorUnidadMedida } from "@/lib/formato";
import type { ResultadoProducto } from "@/lib/consulta-general";

type ResultadosComercialesProps = {
  resultados: ResultadoProducto[];
  alcance: string;
};

function colorCumplimiento(cumplimiento: number | null) {
  if (cumplimiento === null) return "text-muted-foreground";
  return cumplimiento >= 100 ? "text-want-verde" : "text-want-rojo";
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
    <div className="flex items-center gap-6 border-b border-border py-5 last:border-b-0">
      <div className="flex-1">
        <p className="text-sm font-semibold text-want-navy">{resultado.nombre}</p>

        <div className="mt-3 flex items-center gap-3">
          <span className="w-24 shrink-0 text-[11px] font-semibold tracking-wide text-want-naranja uppercase">
            Real
          </span>
          <div className="h-2 flex-1 rounded-full bg-muted">
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
          <span className="w-24 shrink-0 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Presupuesto
          </span>
          <div className="h-2 flex-1 rounded-full bg-muted">
            <div className="h-full w-full rounded-full bg-slate-400" />
          </div>
          <span className="w-28 shrink-0 text-right text-sm font-medium text-foreground">
            {formatoPorUnidadMedida(resultado.presupuesto, resultado.unidadMedida)}
          </span>
        </div>
      </div>

      <div className="w-40 shrink-0 rounded-lg border border-border px-4 py-3 text-center">
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Cumplimiento
        </p>
        <p className={`mt-1 text-2xl font-bold ${colorCumplimiento(resultado.cumplimiento)}`}>
          {resultado.cumplimiento === null ? "—" : `${resultado.cumplimiento}%`}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{textoBrecha}</p>
      </div>
    </div>
  );
}

export function ResultadosComerciales({ resultados, alcance }: ResultadosComercialesProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between bg-want-navy px-5 py-3 text-white">
        <p className="text-sm font-semibold">Presupuesto vs. Real por producto</p>
        <div className="flex items-center gap-4 text-xs">
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
