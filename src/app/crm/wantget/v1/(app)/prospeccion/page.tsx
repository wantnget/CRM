import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/panel";
import { BandejaProspeccion } from "@/components/prospeccion/bandeja-prospeccion";
import { PanelProspeccion } from "@/components/prospeccion/detalle-prospeccion";
import { HistorialAsociado } from "@/components/prospeccion/historial-asociado";
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
import {
  obtenerCanalesDelGestor,
  obtenerDetalle,
  obtenerHistorialAsociado,
} from "@/lib/consultas/detalle";
import { esFiltroBandeja, type FiltroBandeja } from "@/lib/validaciones/prospeccion";

/**
 * Prospección del Gestor (CRM.docx §7.3).
 *
 * Es exclusiva del Gestor: la matriz de visibilidad del spec no le da esta
 * pantalla a ningún otro rol, y el alcance de los datos es el del propio gestor.
 *
 * La prospección abierta viaja en `?id=`. Sin ese parámetro no hay ninguna
 * abierta y el cuadro de gestión muestra su estado vacío, como en el prototipo:
 * al entrar no se preselecciona nada, y volver a pulsar el ítem abierto —o la
 * equis del detalle— lo cierra.
 */

const RUTA = `${BASE_CRM}/prospeccion`;

export default async function ProspeccionPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string; id?: string }>;
}) {
  // Segunda barrera de autorización, además del proxy: el spec exige que el
  // control de alcance por rol no viva solo en la UI.
  const contexto = await exigirAcceso(RUTA);
  const { estado, q, id } = await searchParams;

  const filtro: FiltroBandeja = esFiltroBandeja(estado) ? estado : "curso";
  const busqueda = q ?? "";

  // El proxy y exigirAcceso ya dejaron pasar solo al Gestor, pero la consulta
  // necesita compañía y el tipo no lo garantiza.
  if (contexto.rol.codigo !== "GESTOR" || !contexto.compania) {
    return (
      <>
        <PageHeader contexto={contexto} titulo="Prospección" />
        <div className="px-4 py-6 sm:px-8 sm:py-8">
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

  const [bandeja, asociados, productos, canalesHabilitados] = await Promise.all([
    obtenerBandeja({ ...alcance, filtro, busqueda }),
    obtenerAsociadosAsignados(alcance),
    obtenerProductosActivos(),
    obtenerCanalesHabilitados(contexto.usuario.id),
  ]);

  // Un id que no exista o que sea de otro gestor simplemente no abre nada:
  // obtenerDetalle filtra por gestor, así que devuelve null y no hay fuga.
  const detalle = id
    ? await obtenerDetalle({ ...alcance, oportunidadId: id })
    : null;

  const [historial, canalesDelGestor] = detalle
    ? await Promise.all([
        obtenerHistorialAsociado({
          companiaId: alcance.companiaId,
          asociadoId: detalle.asociadoId,
          oportunidadId: detalle.oportunidadId,
        }),
        obtenerCanalesDelGestor(contexto.usuario.id),
      ])
    : [[], []];

  // Cerrar el detalle conserva el filtro y la búsqueda: solo suelta el id.
  const parametrosSinId = new URLSearchParams({ estado: filtro });
  if (busqueda.trim()) parametrosSinId.set("q", busqueda.trim());
  const hrefSinSeleccion = `${RUTA}?${parametrosSinId.toString()}`;

  return (
    <>
      <PageHeader contexto={contexto} titulo="Prospección" />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Gestione las oportunidades de su cartera. Cada prospección avanza por
            las etapas de contacto, oferta y cierre, y toda gestión queda
            registrada con su canal.
          </p>

          <NuevaProspeccion
            asociados={asociados}
            productos={productos}
            canales={canalesHabilitados}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-2">
            <BandejaProspeccion
              base={RUTA}
              bandeja={bandeja}
              filtro={filtro}
              busqueda={busqueda}
              seleccionadaId={detalle?.oportunidadId ?? null}
            />
          </div>

          <div className="min-w-0 space-y-6 lg:col-span-3">
            {detalle ? (
              <>
                <PanelProspeccion
                  detalle={detalle}
                  canales={canalesDelGestor}
                  hrefCerrar={hrefSinSeleccion}
                />
                <HistorialAsociado gestiones={historial} />
              </>
            ) : (
              <PanelDetalle />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
