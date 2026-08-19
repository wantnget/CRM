"use client";

import { Archive, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ComposerCorreo } from "@/components/correo/composer-correo";
import type { Correo } from "@/lib/consultas/correo";

export function LectorCorreo({ correo }: { correo: Correo | null }) {
  if (!correo) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Selecciona un correo para leerlo.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-foreground">
            {correo.asunto}
          </h2>
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

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            title="Archivar"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Archive className="size-4" />
          </button>
          <button
            type="button"
            title="Eliminar"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback className="bg-want-navy/10 text-want-navy">
              {correo.iniciales}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {correo.remitente}{" "}
                <span className="font-normal text-muted-foreground">
                  &lt;{correo.correoRemitente}&gt;
                </span>
              </p>
              <span className="text-xs text-muted-foreground">{correo.fecha}</span>
            </div>

            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-foreground">
              {correo.cuerpo}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 py-4">
        <ComposerCorreo
          destinatario={correo.correoRemitente}
          asuntoBase={correo.asunto}
        />
      </div>
    </div>
  );
}
