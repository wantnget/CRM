import { cn } from "@/lib/utils";

/**
 * Piezas compartidas de los formularios en diálogo. Viven acá para que el alta
 * de usuarios y la de compañías se vean iguales sin repetir las clases.
 */

export const CLASE_ETIQUETA =
  "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase";

export const CLASE_CAMPO =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-want-navy focus:ring-2 focus:ring-want-navy/20 disabled:bg-muted disabled:text-muted-foreground read-only:bg-muted read-only:text-muted-foreground";

export const BOTON_PRIMARIO =
  "inline-flex h-11 items-center justify-center rounded-lg bg-want-navy px-5 text-sm font-medium text-white transition hover:bg-want-navy/90 disabled:opacity-50 sm:h-10";

export const BOTON_SECUNDARIO =
  "inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50 sm:h-10";

export function Campo({
  etiqueta,
  error,
  ayuda,
  accion,
  children,
}: {
  etiqueta: string;
  error?: string;
  ayuda?: React.ReactNode;
  /** Control opcional a la derecha de la etiqueta, p. ej. "Editar". */
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className={cn(CLASE_ETIQUETA, "block")}>{etiqueta}</label>
        {accion}
      </div>
      {children}
      {ayuda && !error ? (
        <p className="text-xs text-muted-foreground">{ayuda}</p>
      ) : null}
      {error ? <p className="text-xs text-want-rojo">{error}</p> : null}
    </div>
  );
}

/** Mensaje de error general del formulario. */
export function ErrorGeneral({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <p className="rounded-lg bg-want-rojo/10 px-3 py-2 text-sm text-want-rojo">
      {mensaje}
    </p>
  );
}
