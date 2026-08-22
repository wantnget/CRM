"use client";

import { Search } from "lucide-react";

export function BarraCorreo({
  busqueda,
  onBusquedaChange,
}: {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
}) {
  return (
    <div className="relative flex-1">
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
  );
}
