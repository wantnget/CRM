import { PageHeader, periodoVigente, periodoVigenteDb } from "@/components/layout/page-header";
import { ModuloPendiente } from "@/components/layout/modulo-pendiente";
import { ConsultaGeneral } from "@/components/consulta/consulta-general";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM, itemActivo } from "@/lib/navegacion";
import {
  embudo,
  opcionesFiltro,
  resultadosComerciales,
  type FiltroConsulta,
  type RangoConsulta,
} from "@/lib/consulta-general";

/**
 * Consulta comercial. Es una sola ruta para Director, Líder y Gestor: el spec
 * la modela como la misma vista con distinto alcance de datos, no como tres
 * pantallas (CRM.docx §5.2, §6.2, §7.2).
 *
 * El alcance se arma con `FiltroConsulta`, que combina líder y gestor con AND:
 * - DIRECTOR: sin filtros fijos, puede elegir líder y gestor.
 * - LIDER: `liderId` fijo al suyo; elige gestor dentro de su equipo.
 * - GESTOR: `gestorId` fijo al suyo, sin selectores.
 */

type ConsultaPageProps = {
  searchParams: Promise<{ lider?: string; gestor?: string; rango?: string }>;
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

  const esDirector = contexto.rol.codigo === "DIRECTOR";
  const esLider = contexto.rol.codigo === "LIDER";
  const esGestor = contexto.rol.codigo === "GESTOR";

  if ((!esDirector && !esLider && !esGestor) || !contexto.compania) {
    return (
      <>
        <PageHeader contexto={contexto} titulo={titulo} />
        <div className="px-4 py-6 sm:px-8 sm:py-8">
          <ModuloPendiente
            referencia="CRM.docx §1 · PA-01"
            pendiente="Este rol no tiene alcance definido sobre datos comerciales en la matriz de visibilidad."
          />
        </div>
      </>
    );
  }

  const params = await searchParams;

  // Ni el Líder ni el Gestor eligen de quién ver datos: su alcance es fijo. Los
  // query params solo tienen efecto donde el rol lo permite, así que un
  // "?gestor=<id-de-otro>" armado a mano no amplía nada.
  const filtro: FiltroConsulta = esGestor
    ? { gestorId: contexto.usuario.id }
    : {
        liderId: esLider ? contexto.usuario.id : idDeFiltro(params.lider),
        gestorId: idDeFiltro(params.gestor),
      };

  const periodo = periodoVigenteDb();
  const anio = periodo.slice(0, 4);
  const rango = params.rango === "anio" ? "anio" : "mes";
  const rangoConsulta: RangoConsulta =
    rango === "mes" ? { tipo: "mes", periodo } : { tipo: "anio", anio };

  const companiaId = contexto.compania.id;

  const [opciones, resultados, datosEmbudo] = await Promise.all([
    // El Gestor no usa las opciones, pero pedirlas igual mantiene una sola
    // forma de llamada; son dos consultas de catálogo acotadas a la compañía.
    opcionesFiltro(companiaId, esLider ? contexto.usuario.id : undefined),
    resultadosComerciales(companiaId, filtro, rangoConsulta),
    embudo(companiaId, filtro, rangoConsulta),
  ]);

  const alcance = esGestor
    ? contexto.usuario.nombreCompleto
    : filtro.gestorId
      ? (opciones.gestores.find((g) => g.id === filtro.gestorId)?.nombre ?? "Gestor")
      : esLider
        ? `Equipo de ${contexto.usuario.nombreCompleto}`
        : filtro.liderId
          ? (opciones.lideres.find((l) => l.id === filtro.liderId)?.nombre ?? "Líder")
          : "Consolidado compañía";

  return (
    <>
      <PageHeader contexto={contexto} titulo={titulo} />
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <ConsultaGeneral
          basePath={ruta}
          opciones={opciones}
          liderId={esLider ? undefined : filtro.liderId}
          gestorId={esGestor ? undefined : filtro.gestorId}
          alcance={alcance}
          resultados={resultados}
          embudo={datosEmbudo}
          rango={rango}
          // periodoVigente() ya devuelve 'MM-YYYY', que es como lo muestra la UI.
          periodoEtiqueta={periodoVigente()}
          anio={anio}
          conSelectores={!esGestor}
        />
      </div>
    </>
  );
}
