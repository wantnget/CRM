"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * Diálogo de confirmación reutilizable.
 *
 * Reemplaza a `window.confirm`, que además de verse fuera de la guía de estilo
 * bloquea el hilo del navegador. Se apoya en AlertDialog de shadcn para tener
 * el rol `alertdialog` y el manejo de foco correctos.
 *
 * Pensado para reusarse en las demás pantallas que cambian estado, ya que el
 * spec prohíbe el borrado en todas las entidades de negocio y ese cambio de
 * estado siempre conviene confirmarlo.
 */
export function Confirmacion({
  abierto,
  titulo,
  descripcion,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  peligroso = false,
  pendiente = false,
  onConfirmar,
  onCancelar,
}: {
  abierto: boolean;
  titulo: string;
  descripcion?: React.ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Pinta la acción en rojo. Para inactivar y demás cambios de alto impacto. */
  peligroso?: boolean;
  pendiente?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(valor) => {
        if (!valor && !pendiente) onCancelar();
      }}
    >
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-want-navy">
            {titulo}
          </AlertDialogTitle>
          {descripcion ? (
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {descripcion}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={pendiente}
            className="h-10 rounded-lg border-border px-4 text-sm font-medium"
          >
            {textoCancelar}
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={pendiente}
            onClick={(evento) => {
              // Se evita el cierre automático para poder mostrar el estado
              // "pendiente" mientras la acción del servidor responde.
              evento.preventDefault();
              onConfirmar();
            }}
            className={cn(
              "h-10 rounded-lg px-5 text-sm font-medium text-white",
              peligroso
                ? "bg-want-rojo hover:bg-want-rojo/90"
                : "bg-want-navy hover:bg-want-navy/90",
            )}
          >
            {pendiente ? "Procesando..." : textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
