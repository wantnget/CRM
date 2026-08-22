import { Panel } from "@/components/panel";
import { DataTable, type Columna } from "@/components/tabla/data-table";
import { formatoPorUnidadMedida } from "@/lib/formato";
import type { FilaMeta } from "@/lib/metas";

type ProductoColumna = {
  codigo: string;
  nombre: string;
  unidadMedida: "UNIDADES" | "MONTO";
};

type MetasVigentesTablaProps = {
  filas: FilaMeta[];
  productos: ProductoColumna[];
  periodo: string;
};

function cantidadConMeta(fila: FilaMeta) {
  return Object.values(fila.valores).filter((valor) => valor !== null && valor !== undefined).length;
}

export function MetasVigentesTabla({ filas, productos, periodo }: MetasVigentesTablaProps) {
  const columnas: Columna<FilaMeta>[] = [
    {
      id: "gestor",
      encabezado: "Gestor",
      movil: "titulo",
      celda: (fila) => <span className="font-medium text-want-navy">{fila.gestor}</span>,
    },
    {
      id: "lider",
      encabezado: "Líder",
      celda: (fila) => fila.lider,
    },
    {
      id: "periodo",
      encabezado: "Periodo",
      movil: "insignia",
      celda: (fila) =>
        fila.vigente ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-want-naranja/40 bg-want-naranja/10 px-2 py-0.5 text-xs font-medium text-want-navy">
            {fila.periodo}
          </span>
        ) : (
          <span className="text-muted-foreground">{fila.periodo}</span>
        ),
    },
    {
      id: "productos",
      encabezado: "Productos con meta",
      alineacion: "derecha",
      celda: (fila) => `${cantidadConMeta(fila)} de ${productos.length}`,
    },
  ];

  return (
    <Panel titulo="Metas vigentes" meta={`Vigente: ${periodo}`}>
      <DataTable
        columnas={columnas}
        filas={filas}
        claveFila={(fila) => `${fila.gestorId}-${fila.periodo}`}
        vacio="Sin gestores para este filtro."
        expandible={(fila) => (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
            {productos.map((producto) => {
              const valor = fila.valores[producto.codigo];
              return (
                <div key={producto.codigo} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{producto.nombre}</span>
                  <span className="font-medium text-foreground">
                    {valor === null || valor === undefined ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      formatoPorUnidadMedida(valor, producto.unidadMedida)
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      />
    </Panel>
  );
}
