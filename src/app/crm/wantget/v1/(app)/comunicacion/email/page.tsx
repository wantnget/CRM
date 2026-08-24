import { PageHeader } from "@/components/layout/page-header";
import { VistaCorreo } from "@/components/correo/vista-correo";
import { exigirAcceso } from "@/lib/autorizacion";
import { obtenerCorreos, obtenerDestinatariosCorreo } from "@/lib/consultas/correo";
import { BASE_CRM } from "@/lib/navegacion";

const RUTA = `${BASE_CRM}/comunicacion/email`;

export default async function EmailPage() {
  const contexto = await exigirAcceso(RUTA);

  const [correos, destinatarios] = contexto.compania
    ? await Promise.all([
        obtenerCorreos({
          companiaId: contexto.compania.id,
          gestorId: contexto.usuario.id,
        }),
        obtenerDestinatariosCorreo({
          companiaId: contexto.compania.id,
          gestorId: contexto.usuario.id,
        }),
      ])
    : [[], []];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader contexto={contexto} titulo="Email" />

      <div className="min-h-0 flex-1">
        <VistaCorreo
          correos={correos}
          destinatarios={destinatarios}
          gestorId={contexto.usuario.id}
        />
      </div>
    </div>
  );
}
