import type { ConteoEmbudo, Embudo, EmbudoProducto } from "@/lib/consulta-general";

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
  { clave: "ventaFinal", etiqueta: "Finaliza – Venta", color: "bg-want-verde" },
  { clave: "noVentaFinal", etiqueta: "Finaliza – No Venta", color: "bg-want-rojo" },
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
        <span className="shrink-0 text-xs text-muted-foreground">{total} en prospección</span>
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
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between bg-want-navy px-5 py-3 text-white">
          <p className="text-sm font-semibold">
            Embudo de prospección · registros en Estado Prospección
          </p>
          <div className="flex items-center gap-4 text-xs">
            {ETAPAS.map(({ clave, etiqueta, color }) => (
              <span key={clave} className="flex items-center gap-1.5">
                <span className={`h-1.5 w-3 rounded-full ${color}`} />
                {etiqueta}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5">
          <BarraGlobal conteo={embudo.global} />

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {embudo.porProducto.map((producto) => (
          <TarjetaProducto key={producto.codigo} producto={producto} />
        ))}
      </div>
    </div>
  );
}
