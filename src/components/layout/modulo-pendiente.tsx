import { Construction } from "lucide-react";

/**
 * Marcador de módulo cuya navegación ya está lista pero cuya pantalla aún no se
 * construye. Deja a la vista de dónde sale el requerimiento para que quien lo
 * implemente no tenga que buscar en el spec.
 */
export function ModuloPendiente({
  referencia,
  pendiente,
}: {
  referencia: string;
  pendiente: string;
}) {
  return (
    <div className="max-w-2xl rounded-xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-want-naranja/10 text-want-naranja">
          <Construction className="size-4" />
        </span>

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            Pantalla pendiente de construcción
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{pendiente}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Referencia:</span>{" "}
            {referencia}
          </p>
        </div>
      </div>
    </div>
  );
}
