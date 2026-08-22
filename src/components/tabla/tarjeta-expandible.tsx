"use client";

import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { RETRASO_EXPANSION_MS } from "@/components/tabla/fila-expandible";
import { cn } from "@/lib/utils";

/**
 * Equivalente de `FilaExpandible` para la vista de tarjetas. Recibe cuerpo y
 * detalle ya renderizados por la misma razón: `DataTable` es Server Component
 * y no puede pasarle funciones a un Client Component.
 */

type TarjetaExpandibleProps = {
  cuerpo: React.ReactNode;
  detalle: React.ReactNode;
};

export function TarjetaExpandible({ cuerpo, detalle }: TarjetaExpandibleProps) {
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
      {cuerpo}

      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierta}
        className="flex min-h-11 items-center gap-1.5 border-t border-border text-xs font-medium text-muted-foreground transition hover:text-foreground"
      >
        {cargando ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ChevronRight
            aria-hidden
            className={cn("size-4 transition-transform", abierta && "rotate-90")}
          />
        )}
        {abierta ? "Ocultar detalle" : "Ver detalle"}
      </button>

      {abierta ? (
        <div className="rounded-lg bg-muted/40 p-3">{detalle}</div>
      ) : null}
    </>
  );
}
