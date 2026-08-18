import { PageHeader } from "@/components/layout/page-header";
import { ModuloPendiente } from "@/components/layout/modulo-pendiente";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM } from "@/lib/navegacion";

export default async function UsuariosPage() {
  // Segunda barrera de autorización, además del proxy: el spec exige que el
  // control de alcance por rol no viva solo en la UI.
  const contexto = await exigirAcceso(`${BASE_CRM}/usuarios`);

  return (
    <>
      <PageHeader contexto={contexto} titulo="Usuarios" />
      <div className="px-8 py-8">
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          Asigne el rol de plataforma a cada usuario. Para el rol Gestor habilite los canales de comunicación disponibles en su bandeja de prospección.
        </p>

        <ModuloPendiente
          referencia="CRM.docx §4.2 · RN-06 a RN-12, RN-15 a RN-18"
          pendiente="Tabla de usuarios de la compañía con identificación, rol, oficina, canales y estado, más el alta y edición sin borrado físico."
        />
      </div>
    </>
  );
}
