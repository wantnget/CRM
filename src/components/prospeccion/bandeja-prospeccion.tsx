import Link from "next/link";
import { Panel } from "@/components/panel";
import { BuscadorBandeja } from "@/components/prospeccion/buscador-bandeja";
import { ItemBandeja } from "@/components/prospeccion/item-bandeja";
import { cn } from "@/lib/utils";
import type { Bandeja } from "@/lib/consultas/bandeja";
import type { FiltroBandeja } from "@/lib/validaciones/prospeccion";

/**
 * Bandeja de prospección del Gestor (CRM.docx §7.3).
 *
 * El filtro y la búsqueda viajan por URL, como en la Consulta: el enlace queda
 * compartible, el botón de atrás funciona, y la consulta la sigue haciendo el
 * server component que monta esto.
 *
 * La lista tiene scroll propio en vez de crecer: a la derecha va el cuadro de
 * gestión, y si la bandeja empuja la página hacia abajo el cuadro se sale de la
 * pantalla.
 */

const FILTROS: { id: FiltroBandeja; etiqueta: string }[] = [
  { id: "curso", etiqueta: "En curso" },
  { id: "cerradas", etiqueta: "Cerradas" },
  { id: "todas", etiqueta: "Todas" },
];

function enlace(base: string, filtro: FiltroBandeja, busqueda: string) {
  const params = new URLSearchParams({ estado: filtro });
  if (busqueda.trim()) params.set("q", busqueda.trim());
  return `${base}?${params.toString()}`;
}

export function BandejaProspeccion({
  base,
  bandeja,
  filtro,
  busqueda,
}: {
  /** Ruta de la pantalla, sin query. */
  base: string;
  bandeja: Bandeja;
  filtro: FiltroBandeja;
  busqueda: string;
}) {
  const { items, total } = bandeja;

  return (
    <Panel
      titulo="Bandeja de prospección"
      // "7 de 14": lo que muestra el filtro sobre el total del gestor.
      meta={`${items.length} de ${total}`}
      claseCuerpo="max-h-[32rem] overflow-y-auto"
      barra={
        <div className="space-y-3">
          <BuscadorBandeja base={base} />

          <div className="inline-flex rounded-lg border border-border p-0.5">
            {FILTROS.map((f) => (
              <Link
                key={f.id}
                href={enlace(base, f.id, busqueda)}
                aria-current={filtro === f.id ? "true" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  filtro === f.id
                    ? "bg-want-navy text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.etiqueta}
              </Link>
            ))}
          </div>
        </div>
      }
    >
      {items.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
          {busqueda.trim()
            ? `Ningún asociado de tu bandeja coincide con "${busqueda.trim()}".`
            : filtro === "cerradas"
              ? "Todavía no has cerrado ninguna prospección."
              : "No tienes prospecciones en curso. Abre una con “Nueva prospección”."}
        </p>
      ) : (
        <ul>
          {items.map((item) => (
            <ItemBandeja key={item.oportunidadId} item={item} />
          ))}
        </ul>
      )}
    </Panel>
  );
}
