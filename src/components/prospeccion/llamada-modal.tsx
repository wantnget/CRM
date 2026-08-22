"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, PhoneOff } from "lucide-react";
import { formatoDuracion } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { EstadoLlamada } from "@/hooks/use-softphone";

/**
 * Modal flotante de la llamada en curso (canal Llamada).
 *
 * No usa el Dialog modal de la app a propósito: el gestor sigue viendo y
 * usando el resto de la pantalla (registrar la gestión, ver el historial)
 * mientras habla, así que el panel es libre y se puede arrastrar en vez de
 * bloquear con un overlay.
 */

const ETIQUETA_ESTADO: Record<EstadoLlamada, string> = {
  inactivo: "Finalizada",
  conectando: "Conectando...",
  timbrando: "Timbrando...",
  en_llamada: "En llamada",
  error: "No se pudo conectar",
};

export function LlamadaModal({
  estado,
  duracion,
  destino,
  onColgar,
  onCerrar,
}: {
  estado: EstadoLlamada;
  duracion: number;
  destino: string;
  onColgar: () => void;
  /** Solo se ofrece cuando la llamada ya terminó o falló. */
  onCerrar: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [posicion, setPosicion] = useState({ x: 24, y: 96 });
  const arrastre = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback(
    (evento: React.PointerEvent) => {
      arrastre.current = {
        x: evento.clientX - posicion.x,
        y: evento.clientY - posicion.y,
      };
      (evento.target as HTMLElement).setPointerCapture(evento.pointerId);
    },
    [posicion],
  );

  const onPointerMove = useCallback((evento: React.PointerEvent) => {
    if (!arrastre.current) return;
    const ancho = ref.current?.offsetWidth ?? 0;
    const alto = ref.current?.offsetHeight ?? 0;
    const x = Math.min(
      Math.max(0, evento.clientX - arrastre.current.x),
      window.innerWidth - ancho,
    );
    const y = Math.min(
      Math.max(0, evento.clientY - arrastre.current.y),
      window.innerHeight - alto,
    );
    setPosicion({ x, y });
  }, []);

  const onPointerUp = useCallback(() => {
    arrastre.current = null;
  }, []);

  // Reposiciona a la esquina si la ventana se achica y el panel quedó fuera.
  useEffect(() => {
    function onResize() {
      const ancho = ref.current?.offsetWidth ?? 0;
      const alto = ref.current?.offsetHeight ?? 0;
      setPosicion((actual) => ({
        x: Math.min(actual.x, window.innerWidth - ancho),
        y: Math.min(actual.y, window.innerHeight - alto),
      }));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const finalizada = estado === "inactivo" || estado === "error";

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Llamada en curso"
      style={{ left: posicion.x, top: posicion.y }}
      className="fixed z-50 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="cursor-grab touch-none select-none bg-want-navy px-4 py-2 text-xs font-medium text-white/80 active:cursor-grabbing"
      >
        Llamada · arrastrar para mover
      </div>

      <div className="flex flex-col items-center gap-3 px-5 py-5">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-full",
            finalizada
              ? "bg-muted text-muted-foreground"
              : "bg-want-verde/10 text-want-verde",
          )}
        >
          <Phone aria-hidden className="size-6" />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-want-navy">{destino}</p>
          <p
            className={cn(
              "text-xs",
              estado === "error" ? "text-want-rojo" : "text-muted-foreground",
            )}
          >
            {estado === "en_llamada"
              ? formatoDuracion(duracion)
              : ETIQUETA_ESTADO[estado]}
          </p>
        </div>

        {finalizada ? (
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-muted"
          >
            Cerrar
          </button>
        ) : (
          <button
            type="button"
            onClick={onColgar}
            aria-label="Colgar"
            className="inline-flex size-10 items-center justify-center rounded-full bg-want-rojo text-white transition hover:bg-want-rojo/90"
          >
            <PhoneOff aria-hidden className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
