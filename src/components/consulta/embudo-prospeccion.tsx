import type { ConteoEmbudo, Embudo, EmbudoProducto } from "@/lib/consulta-general";

/**
 * Embudo de prospección.
 *
 * Los colores salen de los tokens `--etapa-*` de globals.css y no de la guía de
 * estilo directa: el verde #22C55E de la guía queda a ΔE 5,7 del naranja bajo
 * protanopia, por debajo del piso de 6, así que el token usa #059669 (ΔE 13,0).
 * El resto de los pares adyacentes ya pasaba.
 */

type EmbudoProspeccionProps = {
  embudo: Embudo;
};

const ETAPAS: {
  clave: keyof ConteoEmbudo;
  etiqueta: string;
  color: string;
}[] = [
  { clave: "contacto", etiqueta: "Contacto", color: "bg-want-navy" },
  { clave: "oferta", etiqueta: "Oferta", color: "bg-want-naranja" },
  { clave: "ventaFinal", etiqueta: "Finaliza – Venta", color: "bg-etapa-venta" },
  { clave: "noVentaFinal", etiqueta: "Finaliza – No Venta", color: "bg-etapa-no-venta" },
];

function totalDe(conteo: ConteoEmbudo) {
  return conteo.contacto + conteo.oferta + conteo.ventaFinal + conteo.noVentaFinal;
}

function BarraGlobal({ conteo }: { conteo: ConteoEmbudo }) {
  const total = totalDe(conteo);

  return (
    <div className="flex h-9 w-full overflow-hidden rounded-lg">
      {ETAPAS.map(({ clave, color }) => {
        const valor = conteo[clave];
        if (valor === 0) return null;
        const porcentaje = total > 0 ? (valor / total) * 100 : 0;

        return (
          <div
            key={clave}
            className={`flex items-center justify-center text-xs font-semibold text-white transition-[width] duration-700 ease-out ${color}`}
            style={{ width: `${porcentaje}%` }}
          >
            {porcentaje >= 8 ? `${Math.round(porcentaje)}%` : null}
          </div>
        );
      })}
    </div>
  );
}

function TarjetaProducto({ producto }: { producto: EmbudoProducto }) {
  const { conteo } = producto;
  const total = totalDe(conteo);
  const activos = conteo.contacto + conteo.oferta;
  const maximo = Math.max(conteo.contacto, conteo.oferta, conteo.ventaFinal, conteo.noVentaFinal, 1);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-want-navy">{producto.nombre}</p>
        <span className="shrink-0 text-xs text-muted-foreground">
          {total} oportunidad(es)
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {ETAPAS.map(({ clave, etiqueta, color }) => {
          const valor = conteo[clave];
          const ancho = (valor / maximo) * 100;

          return (
            <div key={clave} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">{etiqueta}</span>
              <div className="h-2 flex-1 rounded-full bg-muted">
                {valor > 0 ? (
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ease-out ${color}`}
                    style={{ width: `${ancho}%` }}
                  />
                ) : null}
              </div>
              <span className="w-6 shrink-0 text-right text-xs font-medium text-foreground">
                {valor}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {activos} activo(s) en contacto u oferta
      </p>
    </div>
  );
}

export function EmbudoProspeccion({ embudo }: EmbudoProspeccionProps) {
  return (
    <div className="@container flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-want-navy px-5 py-3 text-white">
          {/* El conteo incluye las cerradas: etapaDe() las reparte en venta y no
              venta, así que el rótulo no puede decir "solo Prospección". */}
          <p className="text-sm font-semibold">
            Embudo de prospección · abiertas y cerradas del periodo
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            {ETAPAS.map(({ clave, etiqueta, color }) => (
              <span key={clave} className="flex items-center gap-1.5">
                {/* El aro va en las cuatro y no solo en Contacto: la banda usa
                    --want-navy, el mismo token que el color de Contacto, así
                    que su muestra quedaba a contraste 1:1. Uniforme, un color
                    oscuro nuevo en el catálogo no vuelve a desaparecer sin que
                    nadie lo note. */}
                <span
                  className={`h-1.5 w-3 rounded-full ring-1 ring-white/60 ${color}`}
                />
                {etiqueta}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5">
          <BarraGlobal conteo={embudo.global} />

          <div className="mt-5 grid grid-cols-2 gap-4 @2xl:grid-cols-4">
            {ETAPAS.map(({ clave, etiqueta }) => (
              <div key={clave}>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {etiqueta}
                </p>
                <p className="mt-1 text-xl font-bold text-want-navy">{embudo.global[clave]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @5xl:grid-cols-4">
        {embudo.porProducto.map((producto) => (
          <TarjetaProducto key={producto.codigo} producto={producto} />
        ))}
      </div>
    </div>
  );
}
