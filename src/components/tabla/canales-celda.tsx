import { cn } from "@/lib/utils";

/**
 * Celda de canales de comunicación de un Gestor.
 *
 * Muestra los 4 canales siempre, con el habilitado en verde y el resto en gris,
 * como el prototipo. RN-16 garantiza que existan los 4 registros: al crear un
 * Gestor se generan con `habilitado = false`.
 *
 * Los otros roles no tienen canales (RN-15: solo aplica a GESTOR) y se rotulan
 * "No aplica", igual que la columna Oficina.
 */

/**
 * Etiquetas cortas del prototipo. El catálogo guarda "WhatsApp salida" pero la
 * columna es angosta y ahí se abrevia. Van acá y no en la base porque el
 * catálogo es fijo y no editable por el usuario; si algún día hace falta que sea
 * dato, se le agrega `nombre_corto` a `canal_comunicacion`.
 */
const ETIQUETAS: Record<string, string> = {
  WA_SALIDA: "WA salida",
  WA_ENTRADA: "WA entrada",
  CORREO_SALIDA: "Correo salida",
  CORREO_ENTRADA: "Correo entrada",
};

/** Orden de presentación, el mismo `orden` del catálogo. */
const ORDEN = ["WA_SALIDA", "WA_ENTRADA", "CORREO_SALIDA", "CORREO_ENTRADA"];

export type CanalDeUsuario = {
  canalCodigo: string;
  habilitado: boolean;
  /** Respaldo por si aparece un código fuera del mapa de etiquetas cortas. */
  nombre?: string;
};

function NoAplica() {
  return (
    <span className="inline-flex rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
      No aplica
    </span>
  );
}

export function CanalesCelda({ canales }: { canales: CanalDeUsuario[] }) {
  if (canales.length === 0) return <NoAplica />;

  const ordenados = [...canales].sort(
    (a, b) => ORDEN.indexOf(a.canalCodigo) - ORDEN.indexOf(b.canalCodigo),
  );

  return (
    <div className="flex max-w-72 flex-wrap gap-1.5">
      {ordenados.map((canal) => (
        <span
          key={canal.canalCodigo}
          className={cn(
            "inline-flex rounded border px-1.5 py-0.5 text-[11px] whitespace-nowrap",
            canal.habilitado
              ? "border-want-verde/40 bg-want-verde/10 text-emerald-700"
              : "border-border text-muted-foreground",
          )}
        >
          {ETIQUETAS[canal.canalCodigo] ?? canal.nombre ?? canal.canalCodigo}
        </span>
      ))}
    </div>
  );
}
