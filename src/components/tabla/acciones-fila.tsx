"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Estado, GeneroEtiqueta } from "@/components/tabla/estado-pill";

/**
 * Par de acciones de fila: Editar y Activar / Inactivar.
 *
 * No existe un botón de eliminar a propósito. El spec lo prohíbe en todas las
 * entidades de negocio: RN-01 para compañías y RN-06 para usuarios, "no se
 * permite DELETE, lo máximo es cambiar el estado a Inactivo".
 *
 * Acepta href o callback en cada acción, para que sirva tanto con navegación
 * como con server actions cuando se construyan los formularios.
 */

const ETIQUETA_CAMBIO: Record<GeneroEtiqueta, Record<Estado, string>> = {
  masculino: { ACTIVO: "Inactivar", INACTIVO: "Activar" },
  femenino: { ACTIVO: "Inactivar", INACTIVO: "Activar" },
};

const BASE =
  "inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-50";

const NEUTRO = "border-border text-foreground hover:bg-muted";
const PELIGRO = "border-want-rojo/40 text-want-rojo hover:bg-want-rojo/5";

type AccionesFilaProps = {
  estado: Estado;
  genero?: GeneroEtiqueta;
  editarHref?: string;
  onEditar?: () => void;
  onCambiarEstado?: () => void;
  deshabilitado?: boolean;
};

export function AccionesFila({
  estado,
  genero = "masculino",
  editarHref,
  onEditar,
  onCambiarEstado,
  deshabilitado,
}: AccionesFilaProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {editarHref ? (
        <Link href={editarHref} className={cn(BASE, NEUTRO)}>
          Editar
        </Link>
      ) : (
        <button
          type="button"
          onClick={onEditar}
          disabled={deshabilitado || !onEditar}
          className={cn(BASE, NEUTRO)}
        >
          Editar
        </button>
      )}

      <button
        type="button"
        onClick={onCambiarEstado}
        disabled={deshabilitado || !onCambiarEstado}
        className={cn(BASE, PELIGRO)}
      >
        {ETIQUETA_CAMBIO[genero][estado]}
      </button>
    </div>
  );
}
