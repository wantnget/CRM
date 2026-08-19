"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Correo } from "@/lib/consultas/correo";

/**
 * Lista de correos de la bandeja (solo UI). La selección vive en el padre:
 * esta lista es una vista pura, igual que ItemBandeja en Prospección.
 */
export function ListaCorreos({
  correos,
  seleccionadoId,
  onSeleccionar,
}: {
  correos: Correo[];
  seleccionadoId: string | null;
  onSeleccionar: (id: string) => void;
}) {
  if (correos.length === 0) {
    return (
      <p className="px-5 py-12 text-center text-sm text-muted-foreground">
        No hay correos que coincidan con la búsqueda.
      </p>
    );
  }

  return (
    <ul>
      {correos.map((correo) => {
        const seleccionado = correo.id === seleccionadoId;
        return (
          <li key={correo.id}>
            <button
              type="button"
              onClick={() => onSeleccionar(correo.id)}
              aria-current={seleccionado ? "true" : undefined}
              className={cn(
                "flex w-full items-start gap-3 border-b border-l-2 border-border px-4 py-3.5 text-left transition",
                seleccionado
                  ? "border-l-want-naranja bg-want-naranja/5"
                  : "border-l-transparent hover:bg-muted/50",
              )}
            >
              <Avatar size="sm" className="mt-0.5">
                <AvatarFallback className="bg-want-navy/10 text-want-navy">
                  {correo.iniciales}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "truncate text-sm text-foreground",
                      !correo.leido && "font-semibold",
                    )}
                  >
                    {correo.remitente}
                  </p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {correo.fecha}
                  </span>
                </div>

                <p
                  className={cn(
                    "truncate text-sm text-foreground",
                    !correo.leido && "font-medium",
                  )}
                >
                  {correo.asunto}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {correo.extracto}
                </p>

                {correo.etiquetas.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {correo.etiquetas.map((etiqueta) => (
                      <Badge key={etiqueta} variant="outline" className="text-[10px]">
                        {etiqueta}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>

              {!correo.leido ? (
                <span
                  aria-hidden
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-want-naranja"
                />
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
