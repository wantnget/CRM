"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { alternarCanal } from "@/app/crm/wantget/v1/(app)/usuarios/acciones";

/**
 * Canales de comunicación del Gestor, habilitables desde la propia tabla
 * (CRM.docx §4.2: "el Administrador habilita e inhabilita el uso de los Canales
 * de Comunicación"). Verde = habilitado, gris = inhabilitado.
 *
 * RN-15: solo aplica al rol GESTOR; los demás roles muestran "No aplica".
 * RN-18: el backend revalida el permiso, la UI no es el control.
 */

/**
 * Abreviaturas para la columna, que es angosta: "WhatsApp salida" la ensancha
 * de más. Es solo presentación; cualquier canal que no esté acá usa el nombre
 * del catálogo, así que uno nuevo nunca sale como su código en mayúsculas.
 */
const ABREVIATURAS: Record<string, string> = {
  WA_SALIDA: "WA salida",
  WA_ENTRADA: "WA entrada",
};

export type CanalDeUsuario = {
  canalCodigo: string;
  /** Nombre del catálogo `canal_comunicacion`. */
  nombre: string;
  habilitado: boolean;
};

export function CanalesToggle({
  usuarioId,
  canales,
  editable,
  aplica,
}: {
  usuarioId: string;
  /** Ya vienen ordenados por el `orden` del catálogo. */
  canales: CanalDeUsuario[];
  /** Falso para roles que no administra la Admin de Compañía (RN-07). */
  editable: boolean;
  /** RN-15: los canales son del rol Gestor. */
  aplica: boolean;
}) {
  const [pendiente, iniciar] = useTransition();

  if (!aplica || canales.length === 0) {
    return (
      <span className="inline-flex rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
        No aplica
      </span>
    );
  }

  return (
    <div className={cn("flex max-w-72 flex-wrap gap-1.5", pendiente && "opacity-60")}>
      {canales.map((canal) => {
        const etiqueta = ABREVIATURAS[canal.canalCodigo] ?? canal.nombre;

        return (
          <button
            key={canal.canalCodigo}
            type="button"
            // `aria-pressed` porque es un interruptor, no un enlace: el lector
            // de pantalla anuncia el estado además de la etiqueta.
            aria-pressed={canal.habilitado}
            title={
              editable
                ? `${canal.habilitado ? "Inhabilitar" : "Habilitar"} ${etiqueta}`
                : etiqueta
            }
            disabled={!editable || pendiente}
            onClick={() =>
              iniciar(async () => {
                // Se avisa del fallo: antes se descartaba el resultado y un
                // rechazo del backend se veía como "el botón no hace nada".
                const resultado = await alternarCanal(
                  usuarioId,
                  canal.canalCodigo,
                );
                if (!resultado.ok) {
                  toast.error("No se pudo cambiar el canal", {
                    description: resultado.mensaje,
                  });
                }
              })
            }
            className={cn(
              "inline-flex rounded border px-1.5 py-0.5 text-[11px] whitespace-nowrap transition",
              canal.habilitado
                ? "border-want-verde/40 bg-want-verde/10 text-emerald-700"
                : "border-border text-muted-foreground",
              editable
                ? "cursor-pointer hover:brightness-95 focus-visible:ring-2 focus-visible:ring-want-navy/30 focus-visible:outline-none"
                : "cursor-default",
            )}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}
