"use client";

import { Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ContactoLlamada } from "@/lib/consultas/llamadas";

export function ListaContactos({
  contactos,
  seleccionadoId,
  onSeleccionar,
  busqueda,
  onBusquedaChange,
}: {
  contactos: ContactoLlamada[];
  seleccionadoId: string | null;
  onSeleccionar: (oportunidadId: string) => void;
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <div className="px-4 py-3.5">
        <h2 className="text-sm font-medium text-foreground">Contactos</h2>
      </div>

      <div className="border-t border-border px-3 py-3">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar un asociado"
            className="h-9 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-want-navy focus:ring-2 focus:ring-want-navy/20"
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto border-t border-border">
        {contactos.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No hay asociados con prospección abierta y teléfono registrado.
          </p>
        ) : (
          contactos.map((contacto) => {
            const seleccionado = contacto.oportunidadId === seleccionadoId;
            return (
              <li key={contacto.oportunidadId}>
                <button
                  type="button"
                  onClick={() => onSeleccionar(contacto.oportunidadId)}
                  aria-current={seleccionado ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-l-2 border-border px-4 py-3.5 text-left transition",
                    seleccionado
                      ? "border-l-want-naranja bg-want-naranja/5"
                      : "border-l-transparent hover:bg-muted/50",
                  )}
                >
                  <Avatar size="sm">
                    <AvatarFallback className="bg-want-navy/10 text-want-navy">
                      {contacto.iniciales}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {contacto.asociadoNombre}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {contacto.asociadoTelefono} · {contacto.productoNombre}
                    </p>
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
