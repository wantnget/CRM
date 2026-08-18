import { PageHeader } from "@/components/layout/page-header";
import { ModuloPendiente } from "@/components/layout/modulo-pendiente";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM } from "@/lib/navegacion";

export default async function MetasPage() {
  // Segunda barrera de autorización, además del proxy: el spec exige que el
  // control de alcance por rol no viva solo en la UI.
  const contexto = await exigirAcceso(`${BASE_CRM}/metas`);

  return (
    <>
      <PageHeader
        contexto={contexto}
        titulo="Metas"
        descripcion="Cargue el archivo CSV con las metas por producto y gestor del periodo."
      />
      <div className="px-8 py-8">
        <ModuloPendiente
          referencia="CRM.docx §5.2 · RN-47 a RN-50, validaciones V-01 a V-07"
          pendiente="Cargue de CSV separado por punto y coma en UTF-8 con BOM, con trazabilidad en cargue_archivo y descarga del log de errores."
        />
      </div>
    </>
  );
}
