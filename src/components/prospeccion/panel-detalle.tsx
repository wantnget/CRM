import { ClipboardList } from "lucide-react";
import { Panel } from "@/components/panel";

/**
 * Cuadro de gestión de la prospección seleccionada (CRM.docx §7.3).
 *
 * Por ahora solo el estado vacío: el detalle con las tres etapas secuenciales y
 * el historial de gestiones es la segunda parte del módulo. Se deja montado para
 * que la pantalla tenga desde ya las dos columnas del prototipo y la bandeja no
 * quede sola ocupando todo el ancho.
 */
export function PanelDetalle() {
  return (
    <Panel titulo="Gestión de la prospección">
      <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
        <ClipboardList
          aria-hidden
          className="size-8 text-muted-foreground/40"
        />
        <p className="text-sm font-medium text-foreground">
          Selecciona una prospección
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Elige un asociado de la bandeja para ver su detalle, registrar una
          gestión y avanzar de etapa.
        </p>
      </div>
    </Panel>
  );
}
