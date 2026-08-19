"use client";

import { Archive, Inbox, Send, SquarePen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Carpeta = "entrada" | "borradores" | "enviados" | "archivados" | "papelera";

const CARPETAS: { id: Carpeta; etiqueta: string; icono: typeof Inbox }[] = [
  { id: "entrada", etiqueta: "Bandeja de entrada", icono: Inbox },
  { id: "borradores", etiqueta: "Borradores", icono: SquarePen },
  { id: "enviados", etiqueta: "Enviados", icono: Send },
  { id: "archivados", etiqueta: "Archivados", icono: Archive },
  { id: "papelera", etiqueta: "Papelera", icono: Trash2 },
];

/**
 * Columna angosta de carpetas del correo, solo iconos. Es solo UI: fuera de
 * "Bandeja de entrada" las demás carpetas no tienen correos de ejemplo propios,
 * así que muestran la bandeja vacía en vez de datos inventados.
 */
export function CarpetasCorreo({
  carpeta,
  onCarpetaChange,
}: {
  carpeta: Carpeta;
  onCarpetaChange: (carpeta: Carpeta) => void;
}) {
  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-4">
      {CARPETAS.map(({ id, etiqueta, icono: Icono }) => {
        const activa = id === carpeta;
        return (
          <button
            key={id}
            type="button"
            title={etiqueta}
            aria-label={etiqueta}
            aria-current={activa ? "true" : undefined}
            onClick={() => onCarpetaChange(id)}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg transition",
              activa
                ? "bg-want-naranja/15 text-want-naranja"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icono className="size-4.5" />
          </button>
        );
      })}
    </nav>
  );
}

export const ETIQUETA_CARPETA: Record<Carpeta, string> = {
  entrada: "Bandeja de entrada",
  borradores: "Borradores",
  enviados: "Enviados",
  archivados: "Archivados",
  papelera: "Papelera",
};
