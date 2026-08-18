import { Panel } from "@/components/panel";
import { BarraProducto } from "@/components/consulta/barra-producto";
import type { ResultadoProducto } from "@/lib/consultas/resultados";

/**
 * Panel "Presupuesto vs. Real por producto".
 *
 * Los productos se listan por separado y nunca se totalizan: RN-56 prohíbe
 * sumar cantidades con montos, y el catálogo mezcla ambas unidades.
 */

function Leyenda({ contexto }: { contexto: string }) {
  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-2 w-4 rounded-full bg-want-naranja"
        />
        Real
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="h-2 w-4 rounded-full bg-slate-400" />
        Presupuesto
      </span>
      <span className="text-white/60">{contexto}</span>
    </div>
  );
}

export function ResultadosComerciales({
  resultados,
  contexto,
}: {
  resultados: ResultadoProducto[];
  /** Alcance de los datos: el gestor, el equipo del líder o la compañía. */
  contexto: string;
}) {
  const sinDatos = resultados.every((r) => r.real === 0 && r.meta === null);

  return (
    <Panel
      titulo="Presupuesto vs. Real por producto"
      meta={<Leyenda contexto={contexto} />}
    >
      {sinDatos ? (
        <p className="px-6 py-12 text-center text-sm text-muted-foreground">
          No hay ventas ni metas registradas para este periodo.
        </p>
      ) : (
        resultados.map((resultado) => (
          <BarraProducto
            key={resultado.productoCodigo}
            resultado={resultado}
          />
        ))
      )}
    </Panel>
  );
}
