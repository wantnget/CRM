"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type FiltroCorreo = "todos" | "no-leidos";

export function BarraCorreo({
  busqueda,
  onBusquedaChange,
  filtro,
  onFiltroChange,
}: {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  filtro: FiltroCorreo;
  onFiltroChange: (valor: FiltroCorreo) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar en el correo"
          className="h-9 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-want-navy focus:ring-2 focus:ring-want-navy/20"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          aria-current={filtro === "todos" ? "true" : undefined}
          onClick={() => onFiltroChange("todos")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition",
            filtro === "todos"
              ? "bg-want-naranja/15 text-want-navy"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Todos
        </button>
        <button
          type="button"
          aria-current={filtro === "no-leidos" ? "true" : undefined}
          onClick={() => onFiltroChange("no-leidos")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition",
            filtro === "no-leidos"
              ? "bg-want-naranja/15 text-want-navy"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          No leídos
        </button>
      </div>
    </div>
  );
}
