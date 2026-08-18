import { PageHeader } from "@/components/layout/page-header";
import { ModuloPendiente } from "@/components/layout/modulo-pendiente";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM, itemActivo } from "@/lib/navegacion";

export default async function ConsultaPage() {
  // Segunda barrera de autorización, además del proxy: el spec exige que el
  // control de alcance por rol no viva solo en la UI.
  const ruta = `${BASE_CRM}/consulta`;
  const contexto = await exigirAcceso(ruta);

  // El rótulo cambia por rol ("Consulta General" / "Consulta Líder" /
  // "Consulta Gestor") aunque la ruta y la pantalla sean las mismas. Se toma
  // del config de navegación para no repetirlo.
  const titulo =
    itemActivo(contexto.rol.codigo, ruta)?.etiqueta ?? "Consulta";

  return (
    <>
      <PageHeader contexto={contexto} titulo={titulo} />
      <div className="px-8 py-8">
        <ModuloPendiente
          referencia="CRM.docx §5.2, §6.2, §7.2 · RN-55 a RN-57"
          pendiente="Dashboard sobre vw_resultados_comerciales. El alcance de los datos cambia por rol según la matriz de visibilidad, y no se pueden sumar cantidades con montos en un mismo total (RN-56)."
        />
      </div>
    </>
  );
}
