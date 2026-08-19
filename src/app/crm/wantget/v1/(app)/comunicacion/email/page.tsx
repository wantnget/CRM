import { PageHeader } from "@/components/layout/page-header";
import { VistaCorreo } from "@/components/correo/vista-correo";
import { exigirAcceso } from "@/lib/autorizacion";
import { obtenerCorreosMock } from "@/lib/consultas/correo";
import { BASE_CRM } from "@/lib/navegacion";

/**
 * Email del Gestor. Prototipo de solo interfaz: la bandeja se arma con datos
 * de ejemplo (lib/consultas/correo.ts), sin proveedor de correo integrado.
 */

const RUTA = `${BASE_CRM}/comunicacion/email`;

export default async function EmailPage() {
  const contexto = await exigirAcceso(RUTA);
  const correos = obtenerCorreosMock();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader contexto={contexto} titulo="Email" />

      <div className="min-h-0 flex-1">
        <VistaCorreo correos={correos} />
      </div>
    </div>
  );
}
