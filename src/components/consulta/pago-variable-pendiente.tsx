export function PagoVariablePendiente() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
        v2
      </span>
      <p className="text-base font-semibold text-want-navy">
        Pago Variable no habilitado en esta versión
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        La liquidación del variable y los ajustes de pago se incorporan en la
        siguiente entrega, sobre las mismas metas cargadas por el Director.
      </p>
    </div>
  );
}
