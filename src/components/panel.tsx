import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Contenedor de contenido con banda de encabezado azul marino.
 *
 * Es la única pieza que comparten todas las pantallas del prototipo: la tabla
 * de Compañías, la de Usuarios, el "Presupuesto vs. Real" de Consulta y la
 * Bandeja de prospección. El cuerpo lo pone cada pantalla, porque de esas
 * cuatro solo dos son tablas de verdad.
 *
 * Guía de estilo (CRM.docx §2): "banda de encabezado azul marino con icono y
 * título en blanco".
 */
type PanelProps = {
  titulo: string;

  /**
   * Zona derecha de la banda. Es un ReactNode y no un contador porque cambia
   * mucho entre pantallas: "2 compañía(s)" en Compañías, "14 de 14" en la
   * bandeja, y en Consulta la leyenda de colores más "Consolidado compañía".
   */
  meta?: React.ReactNode;

  /**
   * Franja entre la banda y el contenido, para buscadores y filtros que van
   * dentro del panel (así los tiene la Bandeja de prospección). En Consulta los
   * filtros son una tarjeta aparte, encima del panel, y no usan esto.
   */
  barra?: React.ReactNode;

  /**
   * El spec pide un icono en la banda. Queda disponible pero sin uso: en el
   * prototipo actual ninguna de las cuatro bandas lo muestra.
   */
  icono?: LucideIcon;

  children: React.ReactNode;
  className?: string;
  /** Clases del contenedor del cuerpo, p. ej. para alturas con scroll. */
  claseCuerpo?: string;
};

export function Panel({
  titulo,
  meta,
  barra,
  icono: Icono,
  children,
  className,
  claseCuerpo,
}: PanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-4 bg-want-navy px-5 py-3 text-white">
        <h2 className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold">
          {Icono ? <Icono className="size-4 shrink-0" aria-hidden /> : null}
          {titulo}
        </h2>

        {meta ? (
          <div className="shrink-0 text-xs text-white/70">{meta}</div>
        ) : null}
      </header>

      {barra ? (
        <div className="border-b border-border px-5 py-4">{barra}</div>
      ) : null}

      <div className={claseCuerpo}>{children}</div>
    </section>
  );
}
