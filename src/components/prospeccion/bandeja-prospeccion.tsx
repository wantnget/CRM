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
 * El filtro, la búsqueda y la prospección seleccionada viajan por URL, como en
 * la Consulta: el enlace queda compartible, el botón de atrás funciona, y la
 * consulta la sigue haciendo el server component que monta esto.
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

function enlace(
  base: string,
  params: { estado: FiltroBandeja; q: string; id?: string },
) {
  const busqueda = new URLSearchParams({ estado: params.estado });
  if (params.q.trim()) busqueda.set("q", params.q.trim());
  if (params.id) busqueda.set("id", params.id);
  return `${base}?${busqueda.toString()}`;
}

export function BandejaProspeccion({
  base,
  bandeja,
  filtro,
  busqueda,
  seleccionadaId,
}: {
  /** Ruta de la pantalla, sin query. */
  base: string;
  bandeja: Bandeja;
  filtro: FiltroBandeja;
  busqueda: string;
  seleccionadaId: string | null;
}) {
  const { items, total } = bandeja;

  return (
    <Panel
      titulo="Bandeja de prospección"
      // "7 de 14": lo que muestra el filtro sobre el total del gestor.
      meta={`${items.length} de ${total}`}
      claseCuerpo="max-h-[34rem] overflow-y-auto"
      barra={
        <div className="space-y-3">
          <BuscadorBandeja base={base} />

          {/* Tres botones de ancho completo, como en el prototipo. Cambiar de
              filtro conserva la prospección abierta: su detalle no depende de
              que esté en la lista filtrada. */}
          <div className="grid grid-cols-3 gap-2">
            {FILTROS.map((f) => (
              <Link
                key={f.id}
                href={enlace(base, {
                  estado: f.id,
                  q: busqueda,
                  id: seleccionadaId ?? undefined,
                })}
                scroll={false}
                aria-current={filtro === f.id ? "true" : undefined}
                className={cn(
                  "rounded-lg border py-2 text-center text-xs font-medium transition",
                  filtro === f.id
                    ? "border-want-naranja bg-want-naranja/10 text-want-navy"
                    : "border-border text-muted-foreground hover:bg-muted",
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
            <ItemBandeja
              key={item.oportunidadId}
              item={item}
              seleccionado={item.oportunidadId === seleccionadaId}
              href={enlace(base, {
                estado: filtro,
                q: busqueda,
                id: item.oportunidadId,
              })}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}
