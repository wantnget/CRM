import { PageHeader, periodoVigenteDb } from "@/components/layout/page-header";
import { FiltrosConsulta } from "@/components/consulta/filtros-consulta";
import { CargueMetas } from "@/components/metas/cargue-metas";
import { MetasVigentesTabla } from "@/components/metas/metas-vigentes-tabla";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM } from "@/lib/navegacion";
import { opcionesFiltro, type FiltroConsulta } from "@/lib/consulta-general";
import { metasVigentes, productosActivos, resumenCargueMetas } from "@/lib/metas";

type MetasPageProps = {
  searchParams: Promise<{ lider?: string; gestor?: string }>;
};

function idDeFiltro(valor: string | undefined) {
  return valor && valor !== "todos" ? valor : undefined;
}

export default async function MetasPage({ searchParams }: MetasPageProps) {
  // Segunda barrera de autorización, además del proxy: el spec exige que el
  // control de alcance por rol no viva solo en la UI.
  const ruta = `${BASE_CRM}/metas`;
  const contexto = await exigirAcceso(ruta);
  const companiaId = contexto.compania!.id;

  const params = await searchParams;
  const filtro: FiltroConsulta = {
    liderId: idDeFiltro(params.lider),
    gestorId: idDeFiltro(params.gestor),
  };
  const periodo = periodoVigenteDb();

  const [opciones, productos, filas, resumen] = await Promise.all([
    opcionesFiltro(companiaId),
    productosActivos(),
    metasVigentes(companiaId, filtro, periodo),
    resumenCargueMetas(companiaId, periodo),
  ]);

  return (
    <>
      <PageHeader contexto={contexto} titulo="Metas" />
      <div className="flex flex-col gap-6 px-8 py-8">
        <FiltrosConsulta
          basePath={ruta}
          opciones={opciones}
          liderId={filtro.liderId}
          gestorId={filtro.gestorId}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          <CargueMetas resumen={resumen} periodo={periodo} />
          <MetasVigentesTabla filas={filas} productos={productos} periodo={periodo} />
        </div>
      </div>
    </>
  );
}
