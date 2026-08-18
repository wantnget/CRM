import { PageHeader } from "@/components/layout/page-header";
import { ModuloPendiente } from "@/components/layout/modulo-pendiente";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM } from "@/lib/navegacion";

export default async function CompaniasPage() {
  // Segunda barrera de autorización, además del proxy: el spec exige que el
  // control de alcance por rol no viva solo en la UI.
  const contexto = await exigirAcceso(`${BASE_CRM}/companias`);

  return (
    <>
      <PageHeader
        contexto={contexto}
        titulo="Gestión de Compañías"
        descripcion="Cree la compañía y sus dos administradores. Las compañías no se eliminan: para retirarlas cambie el estado a Inactiva."
      />
      <div className="px-8 py-8">
        <ModuloPendiente
          referencia="CRM.docx §3.2 · RN-01 a RN-04, RN-10"
          pendiente="Tabla de compañías con NIT, razón social, administradores y estado, más el alta transaccional de la compañía con sus 2 ADMIN_COMPANIA."
        />
      </div>
    </>
  );
}
