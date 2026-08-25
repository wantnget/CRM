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

export type Alineacion = "izquierda" | "centro" | "derecha";

export type RolMovil =
  | "titulo"
  | "insignia"
  | "pie"
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
  claveFila: (fila: T) => string;
  vacio?: React.ReactNode;
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
    <div className="@container lg:hidden">
      <div className="grid grid-cols-1 gap-3 p-3 @2xl:grid-cols-2">
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
                <dl className="grid grid-cols-1 gap-2">
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
              className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-4"
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
