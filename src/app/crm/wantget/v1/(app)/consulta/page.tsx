import { PageHeader, periodoVigenteDb } from "@/components/layout/page-header";
import { ModuloPendiente } from "@/components/layout/modulo-pendiente";
import { ConsultaGeneral } from "@/components/consulta/consulta-general";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM, itemActivo } from "@/lib/navegacion";
import {
  embudo,
  opcionesFiltro,
  resultadosComerciales,
  type FiltroConsulta,
} from "@/lib/consulta-general";

type ConsultaPageProps = {
  searchParams: Promise<{ lider?: string; gestor?: string }>;
};

function idDeFiltro(valor: string | undefined) {
  return valor && valor !== "todos" ? valor : undefined;
}

export default async function ConsultaPage({ searchParams }: ConsultaPageProps) {
  // Segunda barrera de autorización, además del proxy: el spec exige que el
  // control de alcance por rol no viva solo en la UI.
  const ruta = `${BASE_CRM}/consulta`;
  const contexto = await exigirAcceso(ruta);

  // El rótulo cambia por rol ("Consulta General" / "Consulta Líder" /
  // "Consulta Gestor") aunque la ruta y la pantalla sean las mismas. Se toma
  // del config de navegación para no repetirlo.
  const titulo =
    itemActivo(contexto.rol.codigo, ruta)?.etiqueta ?? "Consulta";

  if (contexto.rol.codigo !== "DIRECTOR" || !contexto.compania) {
    return (
      <>
        <PageHeader contexto={contexto} titulo={titulo} />
        <div className="px-8 py-8">
          <ModuloPendiente
            referencia="CRM.docx §6.2, §7.2 · RN-55 a RN-57"
            pendiente="Consulta Líder y Consulta Gestor: mismo dashboard de Consulta General, con el alcance de datos limitado a la oficina o a la gestión propia."
          />
        </div>
      </>
    );
  }

  const params = await searchParams;
  const filtro: FiltroConsulta = {
    liderId: idDeFiltro(params.lider),
    gestorId: idDeFiltro(params.gestor),
  };
  const periodo = periodoVigenteDb();
  const companiaId = contexto.compania.id;

  const [opciones, resultados, datosEmbudo] = await Promise.all([
    opcionesFiltro(companiaId),
    resultadosComerciales(companiaId, filtro, periodo),
    embudo(companiaId, filtro, periodo),
  ]);

  const alcance = filtro.gestorId
    ? (opciones.gestores.find((g) => g.id === filtro.gestorId)?.nombre ?? "Gestor")
    : filtro.liderId
      ? (opciones.lideres.find((l) => l.id === filtro.liderId)?.nombre ?? "Líder")
      : "Consolidado compañía";

  return (
    <>
      <PageHeader contexto={contexto} titulo={titulo} />
      <div className="px-8 py-8">
        <ConsultaGeneral
          basePath={ruta}
          opciones={opciones}
          liderId={filtro.liderId}
          gestorId={filtro.gestorId}
          alcance={alcance}
          resultados={resultados}
          embudo={datosEmbudo}
        />
      </div>
    </>
  );
}
