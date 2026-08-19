import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/panel";
import { BandejaProspeccion } from "@/components/prospeccion/bandeja-prospeccion";
import { NuevaProspeccion } from "@/components/prospeccion/nueva-prospeccion-dialog";
import { PanelDetalle } from "@/components/prospeccion/panel-detalle";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM } from "@/lib/navegacion";
import {
  obtenerAsociadosAsignados,
  obtenerBandeja,
  obtenerCanalesHabilitados,
  obtenerProductosActivos,
} from "@/lib/consultas/bandeja";
import { esFiltroBandeja, type FiltroBandeja } from "@/lib/validaciones/prospeccion";

/**
 * Prospección del Gestor (CRM.docx §7.3).
 *
 * Primera parte: la bandeja con filtros y búsqueda, y el alta de prospecciones.
 * El detalle de cada una —etapas y historial de gestiones— es la segunda parte.
 *
 * Es exclusiva del Gestor: la matriz de visibilidad del spec no le da esta
 * pantalla a ningún otro rol, y el alcance de los datos es el del propio gestor.
 */

const RUTA = `${BASE_CRM}/prospeccion`;

export default async function ProspeccionPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>;
}) {
  // Segunda barrera de autorización, además del proxy: el spec exige que el
  // control de alcance por rol no viva solo en la UI.
  const contexto = await exigirAcceso(RUTA);
  const { estado, q } = await searchParams;

  const filtro: FiltroBandeja = esFiltroBandeja(estado) ? estado : "curso";
  const busqueda = q ?? "";

  // El proxy y exigirAcceso ya dejaron pasar solo al Gestor, pero la consulta
  // necesita compañía y el tipo no lo garantiza.
  if (contexto.rol.codigo !== "GESTOR" || !contexto.compania) {
    return (
      <>
        <PageHeader contexto={contexto} titulo="Prospección" />
        <div className="px-8 py-8">
          <Panel titulo="Bandeja de prospección">
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              La bandeja de prospección es de los Gestores: las oportunidades se
              trabajan sobre la cartera de asociados que cada uno tiene asignada.
            </p>
          </Panel>
        </div>
      </>
    );
  }

  const alcance = {
    companiaId: contexto.compania.id,
    gestorId: contexto.usuario.id,
  };

  const [bandeja, asociados, productos, canales] = await Promise.all([
    obtenerBandeja({ ...alcance, filtro, busqueda }),
    obtenerAsociadosAsignados(alcance),
    obtenerProductosActivos(),
    obtenerCanalesHabilitados(contexto.usuario.id),
  ]);

  return (
    <>
      <PageHeader contexto={contexto} titulo="Prospección" />

      <div className="px-8 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Gestione las oportunidades de su cartera. Cada prospección avanza por
            las etapas de contacto, oferta y cierre, y toda gestión queda
            registrada con su canal.
          </p>

          <NuevaProspeccion
            asociados={asociados}
            productos={productos}
            canales={canales}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <BandejaProspeccion
              base={RUTA}
              bandeja={bandeja}
              filtro={filtro}
              busqueda={busqueda}
            />
          </div>

          <div className="lg:col-span-3">
            <PanelDetalle />
          </div>
        </div>
      </div>
    </>
  );
}
