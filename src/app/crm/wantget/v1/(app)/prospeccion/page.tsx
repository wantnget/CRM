import { PageHeader } from "@/components/layout/page-header";
import { ModuloPendiente } from "@/components/layout/modulo-pendiente";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM } from "@/lib/navegacion";

export default async function ProspeccionPage() {
  // Segunda barrera de autorización, además del proxy: el spec exige que el
  // control de alcance por rol no viva solo en la UI.
  const contexto = await exigirAcceso(`${BASE_CRM}/prospeccion`);

  return (
    <>
      <PageHeader
        contexto={contexto}
        titulo="Prospección"
        descripcion="Consulte sus ventas en curso y cerradas, o inicie una nueva gestión con los asociados asignados por su líder."
      />
      <div className="px-8 py-8">
        <ModuloPendiente
          referencia="CRM.docx §7.3 · RN-31 a RN-46"
          pendiente="Bandeja de prospección y cuadro de gestión con las 3 etapas secuenciales (contacto, oferta, cierre) y los canales habilitados para el gestor."
        />
      </div>
    </>
  );
}
