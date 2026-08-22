import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { exigirSesion } from "@/lib/autorizacion";
import { rutaInicial } from "@/lib/navegacion";

/**
 * Punto de entrada después del login. No tiene contenido propio: reenvía al
 * primer módulo del rol. Se conserva la ruta porque es el destino al que ya
 * apuntan el proxy y el flujo de OTP.
 *
 * Solo se renderiza para el rol CONSULTA, que no tiene módulos porque PA-01
 * sigue sin resolverse.
 */
export default async function HomePage() {
  const contexto = await exigirSesion();
  const destino = rutaInicial(contexto.rol.codigo);

  if (destino) redirect(destino);

  return (
    <>
      <PageHeader contexto={contexto} titulo="Sin módulos asignados" />
      <div className="px-4 py-8 sm:px-8 sm:py-10">
        <div className="max-w-xl rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            El rol <strong className="text-foreground">{contexto.rol.nombre}</strong>{" "}
            todavía no tiene módulos habilitados. La especificación funcional lo
            menciona pero no le define flujo ni menú (pregunta abierta PA-01),
            así que está pendiente de definición con negocio.
          </p>
        </div>
      </div>
    </>
  );
}
