"use client";

import { Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatoFechaHora } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { Chat } from "@/lib/consultas/whatsapp";

export function ListaChats({
  chats,
  seleccionadoId,
  onSeleccionar,
  busqueda,
  onBusquedaChange,
  accion,
}: {
  chats: Chat[];
  seleccionadoId: string | null;
  onSeleccionar: (id: string) => void;
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  /** Control opcional junto al buscador, p. ej. "Nueva conversación". */
  accion?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <div className="px-4 py-3.5">
        <h2 className="text-sm font-medium text-foreground">WhatsApp</h2>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-3 py-3">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar un chat"
            className="h-9 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-want-navy focus:ring-2 focus:ring-want-navy/20"
          />
        </div>
        {accion}
      </div>

      <ul className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No hay chats que coincidan con la búsqueda.
          </p>
        ) : (
          chats.map((chat) => {
            const seleccionado = chat.id === seleccionadoId;
            return (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => onSeleccionar(chat.id)}
                  aria-current={seleccionado ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-l-2 border-border px-4 py-3 text-left transition",
                    seleccionado
                      ? "border-l-want-naranja bg-want-naranja/5"
                      : "border-l-transparent hover:bg-muted/50",
                  )}
                >
                  <Avatar>
                    <AvatarFallback className="bg-want-navy/10 text-want-navy">
                      {chat.iniciales}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {chat.nombre}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {chat.ultimoMensajeAt
                          ? formatoFechaHora(chat.ultimoMensajeAt)
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-xs text-muted-foreground",
                          chat.noLeidos > 0 && "font-medium text-foreground",
                        )}
                      >
                        {chat.ultimoMensaje}
                      </p>
                      {chat.noLeidos > 0 ? (
                        <Badge className="bg-want-verde text-white">
                          {chat.noLeidos}
                        </Badge>
                      ) : null}
                    </div>
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
