import { cn } from "@/lib/utils";
import { Panel } from "@/components/panel";
import { formatearCantidad } from "@/lib/formato";
import { ETAPAS } from "@/components/consulta/etapas-embudo";
import { TarjetaEmbudo } from "@/components/consulta/tarjeta-embudo";
import type { Embudo } from "@/lib/consultas/embudo";

/**
 * Embudo de prospección: la distribución global y una tarjeta por producto.
 *
 * La barra de arriba es una sola barra apilada al 100%, segmentada por etapa.
 * Lleva 2px de separación entre tramos para que no se lean como uno solo, y
 * cada tramo suficientemente ancho muestra su porcentaje encima; los angostos lo
 * dejan al tooltip y a las cifras de abajo, que están siempre visibles.
 */

/** Un tramo estrecho no aguanta la etiqueta dentro sin recortarla. */
const MINIMO_PARA_ETIQUETA = 8;

function Leyenda() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      {ETAPAS.map((etapa) => (
        <span key={etapa.id} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn("size-2.5 rounded-sm", etapa.fondo)}
          />
          {etapa.etiqueta}
        </span>
      ))}
    </div>
  );
}

function BarraApilada({ embudo }: { embudo: Embudo }) {
  const tramos = ETAPAS.map((etapa) => ({
    etapa,
    valor: embudo.totales[etapa.id],
    porcentaje: embudo.total > 0 ? (embudo.totales[etapa.id] / embudo.total) * 100 : 0,
  })).filter((t) => t.valor > 0);

  return (
    <div className="flex h-8 gap-0.5 overflow-hidden rounded-lg">
      {tramos.map(({ etapa, valor, porcentaje }) => (
        <div
          key={etapa.id}
          className={cn(
            "flex items-center justify-center text-[11px] font-semibold text-white",
            etapa.fondo,
          )}
          style={{ width: `${porcentaje}%` }}
          title={`${etapa.etiqueta}: ${formatearCantidad(valor)} (${Math.round(porcentaje)}%)`}
        >
          {porcentaje >= MINIMO_PARA_ETIQUETA
            ? `${Math.round(porcentaje)}%`
            : null}
        </div>
      ))}
    </div>
  );
}

export function EmbudoProspeccion({
  embudo,
  contexto,
}: {
  embudo: Embudo;
  /** Alcance de los datos: el gestor, el equipo del líder o la compañía. */
  contexto: string;
}) {
  if (embudo.total === 0) {
    return (
      <Panel titulo="Embudo de prospección" meta={<Leyenda />}>
        <p className="px-6 py-12 text-center text-sm text-muted-foreground">
          No hay oportunidades registradas para este periodo.
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <Panel titulo="Embudo de prospección" meta={<Leyenda />}>
        <div className="px-6 py-6">
          <BarraApilada embudo={embudo} />

          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ETAPAS.map((etapa) => (
              <div key={etapa.id}>
                <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {etapa.etiqueta}
                </dt>
                <dd
                  className={cn("mt-0.5 text-2xl font-bold", etapa.texto)}
                >
                  {formatearCantidad(embudo.totales[etapa.id])}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            {formatearCantidad(embudo.total)} oportunidad(es) en total ·{" "}
            {formatearCantidad(embudo.activas)} activa(s) en contacto u oferta ·{" "}
            {contexto}
          </p>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {embudo.productos.map((producto) => (
          <TarjetaEmbudo key={producto.productoCodigo} producto={producto} />
        ))}
      </div>
    </div>
  );
}
