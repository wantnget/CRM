"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ComposerCorreo } from "@/components/correo/composer-correo";
import { ILUSTRACION_CARPETA, type Carpeta } from "@/components/correo/carpetas-correo";
import { formatoFechaHora } from "@/lib/formato";
import type { Correo } from "@/lib/consultas/correo";

export function LectorCorreo({
  correo,
  carpeta,
  onVolver,
  onEliminar,
}: {
  correo: Correo | null;
  carpeta: Carpeta;
  onVolver?: () => void;
  onEliminar?: (id: string) => void;
}) {
  if (!correo) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 bg-card px-6 text-center">
        <Image
          src={ILUSTRACION_CARPETA[carpeta]}
          alt=""
          width={420}
          height={272}
          className="h-auto w-full max-w-xs"
        />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Selecciona un mensaje
          </p>
          <p className="text-sm text-muted-foreground">
            Elige un correo de la lista para ver su contenido aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      {onVolver ? (
        <button
          type="button"
          onClick={onVolver}
          className="flex items-center gap-1.5 border-b border-border px-4 py-3 text-sm text-muted-foreground transition hover:bg-muted/50"
        >
          <ArrowLeft className="size-4" />
          Volver a la bandeja
        </button>
      ) : null}

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
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatoFechaHora(correo.fechaHora)}
                </span>
                {onEliminar ? (
                  <button
                    type="button"
                    onClick={() => onEliminar(correo.id)}
                    title="Eliminar"
                    aria-label="Eliminar"
                    className="flex size-6 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-foreground">
              {correo.cuerpo}
            </p>
          </div>
        </div>
      </div>

      {correo.direccion === "ENTRADA" && carpeta !== "papelera" ? (
        <div className="border-t border-border px-6 py-4">
          <ComposerCorreo
            key={correo.id}
            oportunidadId={correo.oportunidadId}
            destinatario={correo.correoRemitente}
            asuntoBase={correo.asunto}
          />
        </div>
      ) : null}
    </div>
  );
}
