"use client";

import { useTransition } from "react";
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

const ETIQUETAS: Record<string, string> = {
  WA_SALIDA: "WA salida",
  WA_ENTRADA: "WA entrada",
  CORREO_SALIDA: "Correo salida",
  CORREO_ENTRADA: "Correo entrada",
};

const ORDEN = ["WA_SALIDA", "WA_ENTRADA", "CORREO_SALIDA", "CORREO_ENTRADA"];

export type CanalDeUsuario = {
  canalCodigo: string;
  habilitado: boolean;
};

export function CanalesToggle({
  usuarioId,
  canales,
  editable,
}: {
  usuarioId: string;
  canales: CanalDeUsuario[];
  /** Falso para roles que no administra la Admin de Compañía (RN-07). */
  editable: boolean;
}) {
  const [pendiente, iniciar] = useTransition();

  if (canales.length === 0) {
    return (
      <span className="inline-flex rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
        No aplica
      </span>
    );
  }

  const ordenados = [...canales].sort(
    (a, b) => ORDEN.indexOf(a.canalCodigo) - ORDEN.indexOf(b.canalCodigo),
  );

  return (
    <div className={cn("flex max-w-72 flex-wrap gap-1.5", pendiente && "opacity-60")}>
      {ordenados.map((canal) => {
        const etiqueta = ETIQUETAS[canal.canalCodigo] ?? canal.canalCodigo;

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
                await alternarCanal(usuarioId, canal.canalCodigo);
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
