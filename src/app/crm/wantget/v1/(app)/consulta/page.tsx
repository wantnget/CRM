import { PageHeader, periodoVigente } from "@/components/layout/page-header";
import { ModuloPendiente } from "@/components/layout/modulo-pendiente";
import { Panel } from "@/components/panel";
import {
  NavegacionConsulta,
  esPestana,
  esRango,
  type Pestana,
  type Rango,
} from "@/components/consulta/navegacion-consulta";
import { ResultadosComerciales } from "@/components/consulta/resultados-comerciales";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM, itemActivo } from "@/lib/navegacion";
import { nombrePeriodo } from "@/lib/formato";
import {
  obtenerResultados,
  type AlcanceResultados,
  type RangoPeriodo,
} from "@/lib/consultas/resultados";
import type { ContextoUsuario } from "@/lib/contexto-usuario";

/**
 * Consulta comercial. Es una sola ruta para Director, Líder y Gestor: el spec
 * la modela como la misma vista con distinto alcance de datos, no como tres
 * pantallas (CRM.docx §5.2, §6.2, §7.2).
 *
 * Por ahora está construida la vista del Gestor. El alcance ya está
 * parametrizado, así que Líder y Director son agregarles sus filtros.
 */

const RUTA = `${BASE_CRM}/consulta`;

/** Traduce el rol al alcance de datos de la matriz de visibilidad del spec. */
function alcanceDe(contexto: ContextoUsuario): AlcanceResultados | null {
  if (!contexto.compania) return null;
  const companiaId = contexto.compania.id;

  switch (contexto.rol.codigo) {
    case "GESTOR":
      return { rol: "GESTOR", companiaId, gestorId: contexto.usuario.id };
    case "LIDER":
      return { rol: "LIDER", companiaId, liderId: contexto.usuario.id };
    case "DIRECTOR":
      return { rol: "DIRECTOR", companiaId };
    default:
      return null;
  }
}

/** Rótulo del alcance que se muestra en la banda del panel. */
function contextoDe(contexto: ContextoUsuario): string {
  switch (contexto.rol.codigo) {
    case "GESTOR":
      return contexto.usuario.nombreCompleto;
    case "LIDER":
      return `Equipo de ${contexto.usuario.nombreCompleto}`;
    default:
      return "Consolidado compañía";
  }
}

export default async function ConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; rango?: string }>;
}) {
  const contexto = await exigirAcceso(RUTA);
  const { tab, rango: rangoParam } = await searchParams;

  const pestana: Pestana = esPestana(tab) ? tab : "resultados";
  const rango: Rango = esRango(rangoParam) ? rangoParam : "mes";

  // El rótulo cambia por rol ("Consulta General" / "Consulta Líder" /
  // "Consulta Gestor") aunque la ruta y la pantalla sean las mismas.
  const titulo = itemActivo(contexto.rol.codigo, RUTA)?.etiqueta ?? "Consulta";

  // periodoVigente() devuelve 'MM-YYYY' para mostrar; acá se necesita 'YYYY-MM'.
  const [mesActual, anioActual] = periodoVigente().split("-");
  const periodo = `${anioActual}-${mesActual}`;

  const alcance = alcanceDe(contexto);

  if (!alcance) {
    return (
      <>
        <PageHeader contexto={contexto} titulo={titulo} />
        <div className="px-8 py-8">
          <Panel titulo="Resultados comerciales">
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              Este rol no tiene alcance sobre datos comerciales.
            </p>
          </Panel>
        </div>
      </>
    );
  }

  if (pestana === "embudo") {
    return (
      <>
        <PageHeader contexto={contexto} titulo={titulo} />
        <div className="px-8 py-8">
          <NavegacionConsulta
            base={RUTA}
            titulo="Resultados Comerciales"
            pestana={pestana}
            rango={rango}
            periodo={periodo}
            anio={anioActual}
          />
          <ModuloPendiente
            referencia="No definido en CRM.docx ni en la matriz de visibilidad"
            pendiente="El Embudo aparece en el prototipo pero no está en la especificación funcional. Falta definir qué métricas muestra y con qué alcance por rol."
          />
        </div>
      </>
    );
  }

  const rangoConsulta: RangoPeriodo =
    rango === "mes"
      ? { tipo: "mes", periodo }
      : { tipo: "anio", anio: anioActual };

  const resultados = await obtenerResultados(alcance, rangoConsulta);

  return (
    <>
      <PageHeader contexto={contexto} titulo={titulo} />

      <div className="px-8 py-8">
        <NavegacionConsulta
          base={RUTA}
          titulo="Resultados Comerciales"
          pestana={pestana}
          rango={rango}
          periodo={periodo}
          anio={anioActual}
        />

        <p className="mb-4 text-sm text-muted-foreground">
          {rango === "mes"
            ? `Ventas cerradas de ${nombrePeriodo(periodo)} contra la meta del mes.`
            : `Ventas cerradas de ${anioActual} contra la suma de las metas del año.`}
        </p>

        <ResultadosComerciales
          resultados={resultados}
          contexto={contextoDe(contexto)}
        />
      </div>
    </>
  );
}
