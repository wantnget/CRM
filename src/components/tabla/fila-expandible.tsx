"use client";

import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Envuelve una fila cuando la tabla tiene `expandible`. Recibe las celdas y
 * el detalle ya renderizados (JSX, no funciones): un Server Component no
 * puede pasarle funciones a un Client Component, pero sí elementos.
 */

// Retraso puramente perceptivo: el detalle ya está en memoria, pero un cambio
// instantáneo se siente como que no pasó nada al hacer clic.
const RETRASO_EXPANSION_MS = 250;

type FilaExpandibleProps = {
  celdas: React.ReactNode;
  detalle?: React.ReactNode;
  colSpanTotal: number;
};

export function FilaExpandible({ celdas, detalle, colSpanTotal }: FilaExpandibleProps) {
  const [abierta, setAbierta] = useState(false);
  const [cargando, setCargando] = useState(false);

  function alternar() {
    if (abierta) {
      setAbierta(false);
      return;
    }
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      setAbierta(true);
    }, RETRASO_EXPANSION_MS);
  }

  return (
    <>
      <TableRow>
        {detalle !== undefined ? (
          <TableCell className="px-3">
            <button
              type="button"
              onClick={alternar}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={abierta ? "Ocultar detalle" : "Ver detalle"}
              aria-expanded={abierta}
            >
              {cargando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ChevronRight className={cn("size-4 transition-transform", abierta && "rotate-90")} />
              )}
            </button>
          </TableCell>
        ) : null}
        {celdas}
      </TableRow>

      {detalle !== undefined && abierta ? (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={colSpanTotal} className="border-t-0 bg-muted/30 px-5 py-4">
            {detalle}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}
