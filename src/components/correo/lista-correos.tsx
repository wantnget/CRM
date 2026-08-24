"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ETIQUETA_CARPETA, ICONO_CARPETA, type Carpeta } from "@/components/correo/carpetas-correo";
import { formatoFechaHora } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { Correo } from "@/lib/consultas/correo";

export function ListaCorreos({
  correos,
  carpeta,
  totalEnCarpeta,
  seleccionadoId,
  onSeleccionar,
}: {
  correos: Correo[];
  carpeta: Carpeta;
  totalEnCarpeta: number;
  seleccionadoId: string | null;
  onSeleccionar: (id: string) => void;
}) {
  if (correos.length === 0) {
    if (totalEnCarpeta === 0) {
      const IconoCarpeta = ICONO_CARPETA[carpeta];
      return (
        <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
          <IconoCarpeta className="size-6 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No hay correos en {ETIQUETA_CARPETA[carpeta].toLowerCase()}.
          </p>
        </div>
      );
    }

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
                  <p className="truncate text-sm text-foreground">
                    {correo.remitente}
                  </p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatoFechaHora(correo.fechaHora)}
                  </span>
                </div>

                <p className="truncate text-sm font-medium text-foreground">
                  {correo.asunto}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {correo.extracto}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
