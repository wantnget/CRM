import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FiltrosConsulta } from "@/components/consulta/filtros-consulta";
import { ResultadosComerciales } from "@/components/consulta/resultados-comerciales";
import { EmbudoProspeccion } from "@/components/consulta/embudo-prospeccion";
import { PagoVariablePendiente } from "@/components/consulta/pago-variable-pendiente";
import type { Embudo, OpcionesFiltro, ResultadoProducto } from "@/lib/consulta-general";

type ConsultaGeneralProps = {
  basePath: string;
  opciones: OpcionesFiltro;
  liderId?: string;
  gestorId?: string;
  alcance: string;
  resultados: ResultadoProducto[];
  embudo: Embudo;
  rango: "mes" | "anio";
  periodoEtiqueta: string;
  anio: string;
  /** El Gestor solo ve su propia gestión: no se le ofrecen los selectores. */
  conSelectores?: boolean;
};

export function ConsultaGeneral({
  basePath,
  opciones,
  liderId,
  gestorId,
  alcance,
  resultados,
  embudo,
  rango,
  periodoEtiqueta,
  anio,
  conSelectores = true,
}: ConsultaGeneralProps) {
  // Las dos pestañas muestran la misma barra de filtros, con el mismo estado.
  const filtros = (
    <FiltrosConsulta
      basePath={basePath}
      opciones={opciones}
      liderId={liderId}
      gestorId={gestorId}
      rango={rango}
      periodoEtiqueta={periodoEtiqueta}
      anio={anio}
      conSelectores={conSelectores}
    />
  );

  return (
    <Tabs defaultValue="resultados">
      <TabsList variant="line" className="h-auto gap-6 border-b border-border">
        <TabsTrigger
          value="resultados"
          className="px-1 pb-3 text-muted-foreground data-active:font-semibold data-active:text-want-navy data-active:after:bg-want-naranja"
        >
          Resultados Comerciales
        </TabsTrigger>
        <TabsTrigger
          value="embudo"
          className="px-1 pb-3 text-muted-foreground data-active:font-semibold data-active:text-want-navy data-active:after:bg-want-naranja"
        >
          Embudo
        </TabsTrigger>
        <TabsTrigger
          value="pago-variable"
          className="gap-1.5 px-1 pb-3 text-muted-foreground data-active:font-semibold data-active:text-want-navy data-active:after:bg-want-naranja"
        >
          Pago Variable
          <span className="rounded border border-current/25 px-1 text-[10px] leading-4 font-medium">
            v2
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="resultados" className="mt-6 flex flex-col gap-6">
        {filtros}
        <ResultadosComerciales resultados={resultados} alcance={alcance} />
      </TabsContent>

      <TabsContent value="embudo" className="mt-6 flex flex-col gap-6">
        {filtros}
        <EmbudoProspeccion embudo={embudo} />
      </TabsContent>

      <TabsContent value="pago-variable" className="mt-6">
        <PagoVariablePendiente />
      </TabsContent>
    </Tabs>
  );
}
