import { ClipboardList } from "lucide-react";

/**
 * Estado vacío del cuadro de gestión (CRM.docx §7.3).
 *
 * Es lo que se ve al entrar y cada vez que se cierra una prospección. No usa
 * Panel a propósito: en el prototipo esta tarjeta no lleva banda azul, porque
 * no titula un contenido sino que invita a elegir uno.
 */
export function PanelDetalle() {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-full bg-muted"
        >
          <ClipboardList className="size-6 text-muted-foreground/50" />
        </span>

        <p className="text-lg font-semibold text-want-navy">
          Seleccione un prospecto
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Elija un asociado de la bandeja para abrir su cuadro de gestión, o
          inicie una nueva prospección.
        </p>
      </div>
    </section>
  );
}
