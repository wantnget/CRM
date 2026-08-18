import { cn } from "@/lib/utils";

/**
 * Píldora de estado Activo / Inactivo.
 *
 * El género es una exigencia del spec: para `compania` las etiquetas visibles
 * son "Activa" / "Inactiva" por concordancia, aunque el valor almacenado en el
 * enum `estado_generico` sea el mismo ACTIVO / INACTIVO.
 *
 * Colores de la guía de estilo: verde #22C55E para estados activos, rojo
 * #DC2626 para el resto.
 */

export type Estado = "ACTIVO" | "INACTIVO";
export type GeneroEtiqueta = "masculino" | "femenino";

const ETIQUETAS: Record<GeneroEtiqueta, Record<Estado, string>> = {
  masculino: { ACTIVO: "Activo", INACTIVO: "Inactivo" },
  femenino: { ACTIVO: "Activa", INACTIVO: "Inactiva" },
};

export function EstadoPill({
  estado,
  genero = "masculino",
  className,
}: {
  estado: Estado;
  genero?: GeneroEtiqueta;
  className?: string;
}) {
  const activo = estado === "ACTIVO";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        activo
          ? "bg-want-verde/10 text-emerald-700"
          : "bg-want-rojo/10 text-red-700",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          activo ? "bg-want-verde" : "bg-want-rojo",
        )}
      />
      {ETIQUETAS[genero][estado]}
    </span>
  );
}
