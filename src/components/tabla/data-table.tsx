import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilaExpandible } from "@/components/tabla/fila-expandible";
import { TarjetaExpandible } from "@/components/tabla/tarjeta-expandible";
import { cn } from "@/lib/utils";

/**
 * Tabla genérica dirigida por definición de columnas.
 *
 * Solo la usan las pantallas que son tablas de verdad (Compañías, Usuarios,
 * Metas). Consulta y la Bandeja de prospección comparten el `Panel` pero
 * tienen su propio cuerpo, porque son un gráfico y una lista filtrable.
 *
 * `celda` devuelve ReactNode a propósito: así la tabla no necesita conocer los
 * tipos de celda. La celda de dos líneas de Usuarios, el badge de rol, el grupo
 * de píldoras de canales y los botones de acción los define la página, y no hay
 * que tocar este componente cuando aparezca una celda nueva.
 *
 * Debajo de `lg` la misma definición de columnas se renderiza como lista de
 * tarjetas en vez de tabla (ver `ListaTarjetas`). El corte es `lg` y no `md`
 * porque estas tablas piden entre 950px (Compañías) y 1200px (Usuarios) de
 * ancho mínimo: en una tablet la tabla seguiría desbordándose.
 *
 * Este componente se queda como Server Component a propósito: `celda` y
 * `expandible` son funciones, y un Server Component no puede pasarle
 * funciones a un Client Component. Por eso los toggles viven en
 * `FilaExpandible` y `TarjetaExpandible` (aparte, "use client"), que reciben
 * el resultado ya renderizado.
 */

export type Alineacion = "izquierda" | "centro" | "derecha";

/**
 * Papel de una columna en la vista de tarjetas. Sin definir, la columna cae al
 * comportamiento por defecto: un par etiqueta/valor rotulado con `encabezado`.
 */
export type RolMovil =
  /** Encabeza la tarjeta, sin rótulo. Una sola por tabla. */
  | "titulo"
  /** Esquina superior derecha, sin rótulo (píldoras de estado). Una sola. */
  | "insignia"
  /** Franja inferior separada, sin rótulo (botones de acción). */
  | "pie"
  /** No aparece en la tarjeta. */
  | "oculto";

export type Columna<T> = {
  /** Identificador estable; se usa como key de React. */
  id: string;
  encabezado: string;
  celda: (fila: T) => React.ReactNode;
  /** Clase de ancho, p. ej. "w-32" o "min-w-48". */
  ancho?: string;
  alineacion?: Alineacion;
  /** Clases extra para la celda (no para el encabezado). */
  claseCelda?: string;
  /** Papel en la vista de tarjetas (< lg). Ver `RolMovil`. */
  movil?: RolMovil;
};

type DataTableProps<T> = {
  columnas: Columna<T>[];
  filas: T[];
  /** Clave estable por fila. Nunca el índice, para no romper el reordenamiento. */
  claveFila: (fila: T) => string;
  /** Guía de estilo: "estado vacío con texto gris centrado" (CRM.docx §2). */
  vacio?: React.ReactNode;
  /**
   * Si se define, cada fila lleva un chevron que despliega este contenido
   * debajo (p. ej. el detalle por producto de una meta). Opcional porque la
   * mayoría de tablas del prototipo no lo necesitan.
   */
  expandible?: (fila: T) => React.ReactNode;
};

const CLASES_ALINEACION: Record<Alineacion, string> = {
  izquierda: "text-left",
  centro: "text-center",
  derecha: "text-right",
};

function alinear(alineacion: Alineacion = "izquierda") {
  return CLASES_ALINEACION[alineacion];
}

/**
 * Vista de tarjetas para pantallas angostas.
 *
 * Se alimenta de la misma `columnas` que la tabla, así que una pantalla nueva
 * no necesita un segundo bloque de markup: como mucho anota dos o tres
 * columnas con `movil` para dar jerarquía. Sin ninguna anotación la tarjeta
 * sale igual, pero como lista plana de pares etiqueta/valor.
 */
function ListaTarjetas<T>({
  columnas,
  filas,
  claveFila,
  vacio,
  expandible,
}: DataTableProps<T>) {
  const titulo = columnas.find((c) => c.movil === "titulo");
  const insignia = columnas.find((c) => c.movil === "insignia");
  const pie = columnas.filter((c) => c.movil === "pie");
  const campos = columnas.filter((c) => c.movil === undefined);

  if (filas.length === 0) {
    return (
      <p className="px-5 py-12 text-center text-sm text-muted-foreground lg:hidden">
        {vacio}
      </p>
    );
  }

  return (
    // Dos columnas entre sm y lg: a 900px de ancho una tarjeta por fila queda
    // estirada, con el valor pegado al rótulo y mucho blanco a la derecha.
    <div className="grid gap-3 p-3 sm:grid-cols-2 lg:hidden">
      {filas.map((fila) => {
        const cuerpo = (
          <>
            {titulo || insignia ? (
              <div className="flex items-start justify-between gap-3">
                {titulo ? (
                  <div className="min-w-0 text-sm font-semibold text-want-navy">
                    {titulo.celda(fila)}
                  </div>
                ) : null}
                {insignia ? (
                  <div className="shrink-0">{insignia.celda(fila)}</div>
                ) : null}
              </div>
            ) : null}

            {campos.length > 0 ? (
              <dl className="grid gap-2">
                {campos.map((columna) => (
                  <div key={columna.id} className="min-w-0">
                    <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      {columna.encabezado}
                    </dt>
                    {/* wrap-anywhere: varios de estos valores son emails
                        concatenados, tokens largos sin punto de corte. */}
                    <dd className="mt-0.5 text-sm wrap-anywhere">
                      {columna.celda(fila)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {pie.map((columna) => (
              <div key={columna.id} className="border-t border-border pt-3">
                {columna.celda(fila)}
              </div>
            ))}
          </>
        );

        return (
          <article
            key={claveFila(fila)}
            className="flex flex-col gap-3 rounded-lg border border-border p-4"
          >
            {expandible ? (
              <TarjetaExpandible cuerpo={cuerpo} detalle={expandible(fila)} />
            ) : (
              cuerpo
            )}
          </article>
        );
      })}
    </div>
  );
}

export function DataTable<T>({
  columnas,
  filas,
  claveFila,
  vacio = "No hay registros para mostrar.",
  expandible,
}: DataTableProps<T>) {
  return (
    <>
      <ListaTarjetas
        columnas={columnas}
        filas={filas}
        claveFila={claveFila}
        vacio={vacio}
        expandible={expandible}
      />

      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {expandible ? <TableHead className="w-10 px-3" /> : null}
              {columnas.map((columna) => (
                <TableHead
                  key={columna.id}
                  // Guía de estilo: encabezados de columna en mayúsculas pequeñas.
                  className={cn(
                    "h-11 px-5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
                    alinear(columna.alineacion),
                    columna.ancho,
                  )}
                >
                  {columna.encabezado}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filas.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columnas.length + (expandible ? 1 : 0)}
                  className="px-5 py-12 text-center text-sm text-muted-foreground"
                >
                  {vacio}
                </TableCell>
              </TableRow>
            ) : (
              filas.map((fila) => {
                const celdas = columnas.map((columna) => (
                  <TableCell
                    key={columna.id}
                    className={cn(
                      "px-5 py-4 align-middle",
                      alinear(columna.alineacion),
                      columna.claseCelda,
                    )}
                  >
                    {columna.celda(fila)}
                  </TableCell>
                ));

                return (
                  <FilaExpandible
                    key={claveFila(fila)}
                    celdas={celdas}
                    detalle={expandible ? expandible(fila) : undefined}
                    colSpanTotal={columnas.length + (expandible ? 1 : 0)}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
