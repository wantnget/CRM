import { HORA_CIERRE_POR_DEFECTO } from "@/lib/sesion";
import type { ContextoUsuario } from "@/lib/contexto-usuario";
import { SidebarTrigger } from "@/components/ui/sidebar";

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

/** Mismo periodo vigente, en el formato 'YYYY-MM' que usan las tablas del spec. */
export function periodoVigenteDb(ahora: Date = new Date()): string {
  const local = new Date(ahora.getTime() - 5 * 60 * 60 * 1000);
  const mes = String(local.getUTCMonth() + 1).padStart(2, "0");
  return `${local.getUTCFullYear()}-${mes}`;
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
    <header className="sticky top-0 z-20 border-b border-border bg-background px-4 py-3 sm:px-8 sm:py-5">
      <div className="flex items-start gap-2">
        <SidebarTrigger className="-ml-1 mt-0.5 shrink-0 md:hidden" />

        {/* En móvil el título y la meta se apilan dentro de esta columna, así
            comparten el borde izquierdo en vez de desalinearse por el ancho del
            trigger. En sm+ el trigger no se renderiza y la columna vuelve a ser
            la fila con justify-between del diseño de escritorio. */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {/* truncate: para los roles con compañía el eyebrow es
                'razonSocial · rol', que en 375px se envolvería a dos o tres
                líneas y estiraría un header que es sticky. */}
            <p className="truncate text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-want-navy">
              {titulo}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:shrink-0">
            <span className="flex items-center gap-1.5 rounded-full border border-want-naranja/40 bg-want-naranja/5 px-2.5 py-1 font-medium text-want-navy">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-want-verde"
              />
              Periodo {periodoVigente()}
            </span>
            <span className="text-muted-foreground">
              Cierre automático {horaCierre}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
