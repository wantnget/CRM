import { Panel } from "@/components/panel";
import { cn } from "@/lib/utils";
import type { ItemHistorial } from "@/lib/consultas/detalle";

/**
 * Historia de gestiones del asociado (CRM.docx §7.3).
 *
 * Es del asociado y no de la prospección: el spec pide que al iniciar una
 * prospección "el sistema traerá toda la historia de las gestiones de ese
 * cliente". Por eso cada fila dice de qué producto viene, y las que no son de
 * la prospección abierta en pantalla quedan atenuadas.
 */

const FECHA_HORA = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Bogota",
});

const ETIQUETA_ETAPA: Record<string, string> = {
  CONTACTO: "Contacto",
  OFERTA: "Oferta",
  CIERRE: "Cierre",
};

/** WhatsApp y correo se distinguen por color, como en el prototipo. */
const BADGE_MEDIO: Record<string, string> = {
  WHATSAPP: "bg-want-verde/10 text-emerald-700",
  EMAIL: "bg-etapa-contacto/10 text-etapa-contacto-texto",
};

export function HistorialAsociado({
  gestiones,
}: {
  gestiones: ItemHistorial[];
}) {
  return (
    <Panel
      titulo="Historia de gestiones del asociado"
      meta={`${gestiones.length} gestión(es)`}
      claseCuerpo="max-h-[26rem] overflow-y-auto"
    >
      {gestiones.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-muted-foreground">
          Todavía no hay gestiones registradas para este asociado. Elige un canal
          arriba para registrar la primera.
        </p>
      ) : (
        <ol>
          {gestiones.map((gestion) => (
            <li
              key={gestion.id}
              className="border-b border-border px-5 py-4 last:border-b-0"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <time className="text-xs text-muted-foreground">
                  {FECHA_HORA.format(gestion.fechaHora)}
                </time>

                {gestion.canalNombre ? (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                      BADGE_MEDIO[gestion.medio ?? ""] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {gestion.canalNombre}
                  </span>
                ) : (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">
                    Sin canal
                  </span>
                )}

                <span className="text-sm font-medium text-foreground">
                  {ETIQUETA_ETAPA[gestion.etapa] ?? gestion.etapa}
                </span>

                {/* El historial abarca todos los productos del asociado, así que
                    sin esto no se sabría a qué prospección pertenece la fila. */}
                <span
                  className={cn(
                    "ml-auto text-xs",
                    gestion.deEstaProspeccion
                      ? "text-muted-foreground"
                      : "text-muted-foreground/70 italic",
                  )}
                >
                  {gestion.productoNombre}
                  {gestion.deEstaProspeccion ? null : " · otra prospección"}
                </span>
              </div>

              {gestion.observacion ? (
                <p className="mt-1.5 pl-1 text-sm leading-relaxed text-muted-foreground">
                  {gestion.observacion}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
