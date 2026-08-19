import Link from "next/link";
import { X } from "lucide-react";
import { CambioEtapa } from "@/components/prospeccion/cambio-etapa";
import { CanalesGestion } from "@/components/prospeccion/canales-gestion";
import { CierreProspeccion } from "@/components/prospeccion/cierre-prospeccion";
import { EtapasProspeccion } from "@/components/prospeccion/etapas-prospeccion";
import { formatearValor } from "@/lib/formato";
import type { CanalDelGestor, DetalleProspeccion } from "@/lib/consultas/detalle";

/**
 * Cuadro de gestión de la prospección seleccionada (CRM.docx §7.3).
 *
 * No usa Panel: su cabecera lleva dos columnas de información —el asociado a la
 * izquierda, el producto y su valor a la derecha— y no un título con una meta.
 */

const FECHA = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Bogota",
});

export function PanelProspeccion({
  detalle,
  canales,
  hrefCerrar,
}: {
  detalle: DetalleProspeccion;
  canales: CanalDelGestor[];
  /** Vuelve a la bandeja sin prospección abierta. */
  hrefCerrar: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-4 bg-want-navy px-5 py-4 text-white">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">
            {detalle.asociadoNombre}
          </h2>
          <p className="mt-0.5 truncate text-xs text-white/70">
            ID {detalle.asociadoIdentificacion} · Oficina{" "}
            {detalle.oficinaNombre} ·{" "}
            {detalle.ultimaGestion
              ? `Última gestión ${FECHA.format(detalle.ultimaGestion)}`
              : `Abierta el ${FECHA.format(detalle.fechaApertura)}`}
          </p>
        </div>

        <div className="flex shrink-0 items-start gap-3">
          <div className="text-right">
            <p className="text-[11px] font-semibold tracking-wide text-white/70 uppercase">
              {detalle.productoNombre}
            </p>
            <p className="text-lg font-semibold text-want-naranja">
              {detalle.valor === null
                ? "—"
                : formatearValor(detalle.valor, detalle.unidadMedida)}
            </p>
          </div>

          {/* Cerrar el detalle también se puede volviendo a pulsar el ítem en
              la bandeja; el botón lo hace explícito. */}
          <Link
            href={hrefCerrar}
            scroll={false}
            aria-label="Cerrar el detalle de la prospección"
            className="-mr-1 rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </Link>
        </div>
      </header>

      <div className="space-y-6 px-5 py-5">
        <div>
          <EtapasProspeccion detalle={detalle} />
          <CambioEtapa detalle={detalle} />
        </div>

        <div className="border-t border-border pt-5">
          <CanalesGestion detalle={detalle} canales={canales} />
        </div>

        <div className="border-t border-border pt-5">
          <CierreProspeccion detalle={detalle} />
        </div>
      </div>
    </section>
  );
}
