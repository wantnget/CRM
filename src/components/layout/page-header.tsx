import { HORA_CIERRE_POR_DEFECTO } from "@/lib/sesion";
import type { ContextoUsuario } from "@/lib/contexto-usuario";

/**
 * Encabezado de módulo: eyebrow con la compañía, título, y a la derecha el
 * periodo vigente y la hora de cierre automático de sesión
 * (`compania.hora_cierre_sesion`, la decisión que resolvió PA-04).
 */

/** El spec guarda el periodo como 'YYYY-MM' y el prototipo lo muestra 'MM-YYYY'. */
export function periodoVigente(ahora: Date = new Date()): string {
  // America/Bogota es UTC-5 fijo (Colombia no aplica horario de verano).
  const local = new Date(ahora.getTime() - 5 * 60 * 60 * 1000);
  const mes = String(local.getUTCMonth() + 1).padStart(2, "0");
  return `${mes}-${local.getUTCFullYear()}`;
}

type PageHeaderProps = {
  contexto: ContextoUsuario;
  titulo: string;
};

/**
 * El encabezado lleva solo eyebrow y titulo, como en el prototipo. El texto
 * introductorio de cada modulo vive en el cuerpo de la pagina, que es donde el
 * prototipo lo ubica (junto al boton de accion, sobre la tabla).
 */
export function PageHeader({ contexto, titulo }: PageHeaderProps) {
  // ADMIN_GENERAL no pertenece a una compañía, así que no hay razón social que
  // mostrar como eyebrow; se rotula por rol.
  const eyebrow = contexto.compania
    ? `${contexto.compania.razonSocial} · ${contexto.rol.nombre}`
    : contexto.rol.nombre;

  const horaCierre =
    contexto.compania?.horaCierreSesion ?? HORA_CIERRE_POR_DEFECTO;

  return (
    <header className="border-b border-border bg-background px-8 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-want-navy">
            {titulo}
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 rounded-full border border-want-naranja/40 bg-want-naranja/5 px-2.5 py-1 font-medium text-want-navy">
            <span className="size-1.5 rounded-full bg-want-verde" />
            Periodo {periodoVigente()}
          </span>
          <span className="text-muted-foreground">
            Cierre automático {horaCierre}
          </span>
        </div>
      </div>

    </header>
  );
}
