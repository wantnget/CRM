import { cn } from "@/lib/utils";
import type { RolCodigo } from "@/lib/navegacion";

/**
 * Insignia de rol de plataforma.
 *
 * La etiqueta viene de `rol.nombre` en la base, no de un literal, para que siga
 * al catálogo si se renombra un rol. El color se elige por código, siguiendo el
 * prototipo: Director en azul, Líder en ámbar, el resto en gris.
 */

const COLORES: Record<RolCodigo, string> = {
  ADMIN_GENERAL: "bg-want-navy/10 text-want-navy",
  ADMIN_COMPANIA: "bg-muted text-foreground",
  DIRECTOR: "bg-want-navy/10 text-want-navy",
  LIDER: "bg-want-naranja/15 text-amber-700",
  GESTOR: "bg-muted text-muted-foreground",
  CONSULTA: "bg-muted text-muted-foreground",
};

export function RolBadge({
  codigo,
  nombre,
  className,
}: {
  codigo: RolCodigo;
  nombre: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase",
        COLORES[codigo],
        className,
      )}
    >
      {nombre}
    </span>
  );
}
