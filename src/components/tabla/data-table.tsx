import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Tabla genérica dirigida por definición de columnas.
 *
 * Solo la usan las pantallas que son tablas de verdad (Compañías, Usuarios).
 * Consulta y la Bandeja de prospección comparten el `Panel` pero tienen su
 * propio cuerpo, porque son un gráfico y una lista filtrable.
 *
 * `celda` devuelve ReactNode a propósito: así la tabla no necesita conocer los
 * tipos de celda. La celda de dos líneas de Usuarios, el badge de rol, el grupo
 * de píldoras de canales y los botones de acción los define la página, y no hay
 * que tocar este componente cuando aparezca una celda nueva.
 */

export type Alineacion = "izquierda" | "centro" | "derecha";

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
};

type DataTableProps<T> = {
  columnas: Columna<T>[];
  filas: T[];
  /** Clave estable por fila. Nunca el índice, para no romper el reordenamiento. */
  claveFila: (fila: T) => string;
  /** Guía de estilo: "estado vacío con texto gris centrado" (CRM.docx §2). */
  vacio?: React.ReactNode;
};

const CLASES_ALINEACION: Record<Alineacion, string> = {
  izquierda: "text-left",
  centro: "text-center",
  derecha: "text-right",
};

function alinear(alineacion: Alineacion = "izquierda") {
  return CLASES_ALINEACION[alineacion];
}

export function DataTable<T>({
  columnas,
  filas,
  claveFila,
  vacio = "No hay registros para mostrar.",
}: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
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
              colSpan={columnas.length}
              className="px-5 py-12 text-center text-sm text-muted-foreground"
            >
              {vacio}
            </TableCell>
          </TableRow>
        ) : (
          filas.map((fila) => (
            <TableRow key={claveFila(fila)}>
              {columnas.map((columna) => (
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
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
