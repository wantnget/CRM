"use client";

import { Archive, Inbox, Send, SquarePen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Carpeta = "entrada" | "borradores" | "enviados" | "archivados" | "papelera";

const CARPETAS: {
  id: Carpeta;
  etiqueta: string;
  icono: typeof Inbox;
  ilustracion: string;
}[] = [
  { id: "entrada", etiqueta: "Bandeja de entrada", icono: Inbox, ilustracion: "/mall.svg" },
  { id: "borradores", etiqueta: "Borradores", icono: SquarePen, ilustracion: "/draft.svg" },
  { id: "enviados", etiqueta: "Enviados", icono: Send, ilustracion: "/enviar.svg" },
  { id: "archivados", etiqueta: "Archivados", icono: Archive, ilustracion: "/archived.svg" },
  { id: "papelera", etiqueta: "Papelera", icono: Trash2, ilustracion: "/bin.svg" },
];

/** Columna angosta de carpetas del correo, solo iconos. */
export function CarpetasCorreo({
  carpeta,
  className,
  onCarpetaChange,
}: {
  carpeta: Carpeta;
  className?: string;
  onCarpetaChange: (carpeta: Carpeta) => void;
}) {
  return (
    <nav
      className={cn(
        "flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-4",
        className,
      )}
    >
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

export const ETIQUETA_CARPETA: Record<Carpeta, string> = Object.fromEntries(
  CARPETAS.map(({ id, etiqueta }) => [id, etiqueta]),
) as Record<Carpeta, string>;

export const ICONO_CARPETA: Record<Carpeta, typeof Inbox> = Object.fromEntries(
  CARPETAS.map(({ id, icono }) => [id, icono]),
) as Record<Carpeta, typeof Inbox>;

export const ILUSTRACION_CARPETA: Record<Carpeta, string> = Object.fromEntries(
  CARPETAS.map(({ id, ilustracion }) => [id, ilustracion]),
) as Record<Carpeta, string>;
