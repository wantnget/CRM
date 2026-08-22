"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CLASE_ETIQUETA } from "@/components/form/campos";
import { cn } from "@/lib/utils";

/**
 * Cáscara de los formularios en diálogo.
 *
 * Los ocho diálogos de la aplicación repetían el mismo encabezado, el mismo pie
 * y la misma combinación de clases en `DialogContent`. Centralizarla arregla de
 * una vez tres cosas que estaban mal en todos:
 *
 * 1. El scroll vivía en `DialogContent`, así que arrastraba encabezado y pie:
 *    en un teléfono se perdían de vista el título y los botones de acción. Acá
 *    el scroll es del cuerpo y los otros dos quedan anclados (`shrink-0`).
 *
 * 2. `DialogFooter` trae `-mx-4 -mb-4` de fábrica, pensados para un contenido
 *    con `p-4`. Con `p-0` esos márgenes negativos sacaban el pie 16px por fuera
 *    del diálogo por cada lado — y como `overflow-y-auto` en un eje resuelve el
 *    otro como `auto`, le agregaban scroll horizontal. Se neutralizan con
 *    `mx-0 mb-0`.
 *
 * 3. `max-h-[90vh]` mide el viewport con la barra del navegador oculta, así que
 *    en móvil podía exceder lo visible y empujar el pie fuera de pantalla. Se
 *    usa `dvh`, que sigue al viewport dinámico.
 */

const ANCHOS = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
} as const;

type DialogoFormularioProps = {
  /** Rótulo pequeño sobre el título, p. ej. "Gestión de Compañías". */
  etiqueta: React.ReactNode;
  titulo: React.ReactNode;
  /** Contenido extra bajo el título, p. ej. el indicador de pasos del wizard. */
  encabezadoExtra?: React.ReactNode;
  /** Botones del pie. */
  pie: React.ReactNode;
  children: React.ReactNode;
  onCerrar: () => void;
  /** Mientras esté en true, el diálogo no se cierra por Esc ni por clic fuera. */
  bloqueado?: boolean;
  /**
   * Si se define, cuerpo y pie se envuelven en un `<form>`. Los diálogos que
   * envían con un botón `type="submit"` lo necesitan; los que llaman a la acción
   * desde un `onClick` (el wizard, oficinas) no.
   */
  onSubmit?: (evento: React.FormEvent<HTMLFormElement>) => void;
  ancho?: keyof typeof ANCHOS;
  /** Clases extra del pie, p. ej. "sm:justify-between". */
  clasePie?: string;
};

export function DialogoFormulario({
  etiqueta,
  titulo,
  encabezadoExtra,
  pie,
  children,
  onCerrar,
  bloqueado = false,
  onSubmit,
  ancho = "lg",
  clasePie,
}: DialogoFormularioProps) {
  // min-h-0 en el cuerpo es lo que habilita el scroll: sin él un hijo flex no
  // se encoge por debajo de su contenido y el overflow nunca se activa.
  const cuerpoYPie = (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
        {children}
      </div>

      <DialogFooter
        className={cn(
          "mx-0 mb-0 shrink-0 border-t border-border px-6 py-4",
          clasePie,
        )}
      >
        {pie}
      </DialogFooter>
    </>
  );

  return (
    <Dialog
      open
      onOpenChange={(abierto) => !abierto && !bloqueado && onCerrar()}
    >
      <DialogContent
        className={cn(
          "flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0",
          ANCHOS[ancho],
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5 text-left">
          <p className={CLASE_ETIQUETA}>{etiqueta}</p>
          <DialogTitle className="text-xl font-semibold text-want-navy">
            {titulo}
          </DialogTitle>
          {encabezadoExtra}
        </DialogHeader>

        {onSubmit ? (
          <form
            onSubmit={onSubmit}
            className="flex min-h-0 flex-1 flex-col"
            noValidate
          >
            {cuerpoYPie}
          </form>
        ) : (
          cuerpoYPie
        )}
      </DialogContent>
    </Dialog>
  );
}
