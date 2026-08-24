"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

/**
 * Campo de búsqueda de la bandeja.
 *
 * Es cliente solo para poder escribir sin recargar; lo que persiste es el
 * parámetro `q` de la URL, igual que el filtro. Se envía al presionar Enter y
 * no en cada tecla: cada envío es una consulta a la base, y la bandeja no tiene
 * paginación todavía.
 */
export function BuscadorBandeja({ base }: { base: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [texto, setTexto] = useState(() => params.get("q") ?? "");

  function navegar(termino: string) {
    const siguiente = new URLSearchParams(params);
    if (termino.trim()) siguiente.set("q", termino.trim());
    else siguiente.delete("q");

    const consulta = siguiente.toString();
    router.push(consulta ? `${base}?${consulta}` : base);
  }

  return (
    <form
      role="search"
      onSubmit={(evento) => {
        evento.preventDefault();
        navegar(texto);
      }}
      className="relative"
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />

      <input
        type="search"
        name="q"
        aria-label="Buscar asociado o identificación"
        placeholder="Buscar asociado o ID"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        className="h-9 w-full rounded-lg border border-input bg-background pr-9 pl-9 text-sm outline-none transition focus:border-want-navy focus:ring-2 focus:ring-want-navy/20"
      />

      {texto ? (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            setTexto("");
            navegar("");
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </form>
  );
}
