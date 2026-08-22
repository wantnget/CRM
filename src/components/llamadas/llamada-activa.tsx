"use client";

import { Mic, MicOff, PhoneOff } from "lucide-react";
import { formatoDuracion } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { EstadoLlamada } from "@/hooks/use-softphone";

const ETIQUETA_ESTADO: Record<EstadoLlamada, string> = {
  inactivo: "Llamada finalizada",
  conectando: "Conectando...",
  timbrando: "Timbrando...",
  en_llamada: "En llamada",
  error: "No se pudo conectar",
};

/** Llamada en curso, ocupando el panel del contacto. */
export function LlamadaActiva({
  nombre,
  telefono,
  iniciales,
  estado,
  duracion,
  silenciado,
  onSilenciar,
  onColgar,
  onCerrar,
}: {
  nombre: string;
  telefono: string;
  iniciales: string;
  estado: EstadoLlamada;
  duracion: number;
  silenciado: boolean;
  onSilenciar: () => void;
  onColgar: () => void;
  onCerrar: () => void;
}) {
  const terminada = estado === "inactivo" || estado === "error";

  return (
    <section
      aria-label={`Llamada con ${nombre}`}
      className="flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border border-border bg-card p-4"
    >
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-6 rounded-xl text-center ring-2",
          terminada
            ? "bg-muted/40 ring-border"
            : "bg-want-verde/5 ring-want-verde/40",
        )}
      >
        <div
          className={cn(
            "flex size-28 items-center justify-center rounded-full text-3xl font-semibold ring-4",
            terminada
              ? "bg-muted text-muted-foreground ring-border"
              : "bg-want-navy/10 text-want-navy ring-want-verde/30",
          )}
        >
          {iniciales}
        </div>

        <p
          className={cn(
            "text-5xl font-light tabular-nums",
            estado === "error" ? "text-want-rojo" : "text-foreground",
          )}
        >
          {estado === "en_llamada"
            ? formatoDuracion(duracion)
            : ETIQUETA_ESTADO[estado]}
        </p>

        <div className="space-y-1">
          <p className="text-lg font-medium text-foreground">{nombre}</p>
          <p className="text-sm text-muted-foreground">{telefono}</p>
          {silenciado && !terminada ? (
            <p className="pt-1 text-xs font-medium text-want-naranja">
              Micrófono silenciado
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-3">
        {terminada ? (
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Cerrar
          </button>
        ) : (
          <>
            <BotonRedondo
              etiqueta={silenciado ? "Activar micrófono" : "Silenciar micrófono"}
              onClick={onSilenciar}
              activo={silenciado}
            >
              {silenciado ? (
                <MicOff className="size-5" />
              ) : (
                <Mic className="size-5" />
              )}
            </BotonRedondo>

            <button
              type="button"
              onClick={onColgar}
              aria-label="Colgar"
              title="Colgar"
              className="ml-2 inline-flex h-12 w-16 items-center justify-center rounded-full bg-want-rojo text-white transition hover:bg-want-rojo/90"
            >
              <PhoneOff className="size-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function BotonRedondo({
  etiqueta,
  onClick,
  activo = false,
  children,
}: {
  etiqueta: string;
  onClick: () => void;
  activo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        "inline-flex size-12 items-center justify-center rounded-full transition",
        activo
          ? "bg-want-navy text-white"
          : "bg-muted text-foreground hover:bg-muted/70",
      )}
    >
      {children}
    </button>
  );
}
