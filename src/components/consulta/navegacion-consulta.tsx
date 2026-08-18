import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatearPeriodo } from "@/lib/formato";

/**
 * Pestañas de la Consulta y selector de rango.
 *
 * Van por URL y no por estado local: así el enlace se puede compartir, el
 * server component trae solo lo que esa vista necesita, y el botón de atrás del
 * navegador funciona.
 *
 * El selector de rango queda fuera del panel a propósito: un filtro dentro de
 * la tarjeta del gráfico se lee como parte del dato.
 */

export const PESTANAS = ["resultados", "embudo"] as const;
export type Pestana = (typeof PESTANAS)[number];

export const RANGOS = ["mes", "anio"] as const;
export type Rango = (typeof RANGOS)[number];

export function esPestana(valor: string | undefined): valor is Pestana {
  return (PESTANAS as readonly string[]).includes(valor ?? "");
}

export function esRango(valor: string | undefined): valor is Rango {
  return (RANGOS as readonly string[]).includes(valor ?? "");
}

function enlace(base: string, params: Record<string, string>) {
  const busqueda = new URLSearchParams(params);
  return `${base}?${busqueda.toString()}`;
}

export function NavegacionConsulta({
  base,
  titulo,
  pestana,
  rango,
  periodo,
  anio,
}: {
  /** Ruta de la consulta, sin query. */
  base: string;
  /** Rótulo de la primera pestaña; cambia por rol. */
  titulo: string;
  pestana: Pestana;
  rango: Rango;
  periodo: string;
  anio: string;
}) {
  const pestanas: { id: Pestana; etiqueta: string }[] = [
    { id: "resultados", etiqueta: titulo },
    { id: "embudo", etiqueta: "Embudo" },
  ];

  return (
    <div className="mb-6">
      <nav
        aria-label="Secciones de la consulta"
        className="flex items-center gap-6 border-b border-border"
      >
        {pestanas.map((p) => (
          <Link
            key={p.id}
            href={enlace(base, { tab: p.id, rango })}
            aria-current={pestana === p.id ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition",
              pestana === p.id
                ? "border-want-naranja text-want-navy"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {p.etiqueta}
          </Link>
        ))}

        {/* Pago Variable es fase 2 en el spec: se muestra, no navega. */}
        <span className="-mb-px flex cursor-not-allowed items-center gap-1.5 border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-muted-foreground/50">
          Pago Variable
          <span className="rounded border border-current px-1 text-[10px] leading-4">
            V2
          </span>
        </span>
      </nav>

      {pestana === "resultados" ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Rango
          </span>

          <div className="inline-flex rounded-lg border border-border p-0.5">
            <Link
              href={enlace(base, { tab: pestana, rango: "mes" })}
              aria-current={rango === "mes" ? "true" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                rango === "mes"
                  ? "bg-want-navy text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Mes {formatearPeriodo(periodo)}
            </Link>
            <Link
              href={enlace(base, { tab: pestana, rango: "anio" })}
              aria-current={rango === "anio" ? "true" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                rango === "anio"
                  ? "bg-want-navy text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Acumulado {anio}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
