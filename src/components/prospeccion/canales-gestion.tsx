"use client";

import { useState, useTransition } from "react";
import {
  BOTON_PRIMARIO,
  CLASE_CAMPO,
  CLASE_ETIQUETA,
  ErrorGeneral,
} from "@/components/form/campos";
import { cn } from "@/lib/utils";
import { ETAPAS } from "@/lib/validaciones/prospeccion";
import type { CanalDelGestor, DetalleProspeccion } from "@/lib/consultas/detalle";
import type { ResultadoAccion } from "@/lib/validaciones/usuario";
import { registrarGestion } from "@/app/crm/wantget/v1/(app)/prospeccion/acciones";

/**
 * Canales del gestor y registro de la gestión (CRM.docx §7.3).
 *
 * Se muestran los cuatro canales del catálogo, no solo los habilitados: la
 * banda dice "canales habilitados por el Administrador de Compañía", y para que
 * eso se entienda hay que ver también cuál quedó fuera. El deshabilitado no es
 * pulsable, y el backend lo revalida de todos modos (RN-44).
 *
 * Al elegir un canal se abre el formulario en línea, como en el prototipo. La
 * etapa que se elige ahí es la de la gestión —"la etapa en la que se realizó
 * esta gestión"—, no la de la prospección: eso se mueve aparte.
 */

const ETIQUETA_ETAPA: Record<string, string> = {
  CONTACTO: "Contacto",
  OFERTA: "Oferta",
  CIERRE: "Cierre",
};

export function CanalesGestion({
  detalle,
  canales,
}: {
  detalle: DetalleProspeccion;
  canales: CanalDelGestor[];
}) {
  const [canal, setCanal] = useState<CanalDelGestor | null>(null);

  return (
    <section>
      <p className={CLASE_ETIQUETA}>
        Canales habilitados por el administrador de compañía
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {canales.map((c) => {
          const activo = canal?.codigo === c.codigo;
          const pulsable = c.habilitado && !detalle.cerrada;

          return (
            <button
              key={c.codigo}
              type="button"
              disabled={!pulsable}
              aria-pressed={activo}
              title={
                c.habilitado
                  ? detalle.cerrada
                    ? "La prospección está cerrada"
                    : undefined
                  : "El Administrador de tu compañía no habilitó este canal"
              }
              onClick={() => setCanal(activo ? null : c)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition",
                activo
                  ? "border-want-naranja bg-want-naranja/10 text-want-navy"
                  : "border-border",
                pulsable
                  ? "hover:bg-muted"
                  : "cursor-not-allowed text-muted-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  c.habilitado ? "bg-want-verde" : "bg-muted-foreground/40",
                )}
              />
              {c.nombre}
            </button>
          );
        })}
      </div>

      {/* Se monta solo al elegir un canal, así el formulario arranca limpio en
          cada gestión sin un efecto que lo resincronice. */}
      {canal ? (
        <FormularioGestion
          key={canal.codigo}
          detalle={detalle}
          canal={canal}
          onCerrar={() => setCanal(null)}
        />
      ) : null}

      {detalle.cerrada ? (
        <p className="mt-3 text-xs text-muted-foreground">
          La prospección está cerrada, así que no admite nuevas gestiones
          (RN-38). Su historia sigue disponible abajo.
        </p>
      ) : null}
    </section>
  );
}

function FormularioGestion({
  detalle,
  canal,
  onCerrar,
}: {
  detalle: DetalleProspeccion;
  canal: CanalDelGestor;
  onCerrar: () => void;
}) {
  const [observacion, setObservacion] = useState("");
  // Por defecto, la etapa en la que está la prospección: es donde de hecho
  // ocurre la gestión salvo que el gestor diga otra cosa.
  const [etapa, setEtapa] = useState<string>(detalle.etapa);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrores({});
    setMensaje(null);

    iniciar(async () => {
      const resultado: ResultadoAccion = await registrarGestion({
        oportunidadId: detalle.oportunidadId,
        canalCodigo: canal.codigo,
        etapa,
        observacion,
      });

      if (resultado.ok) {
        onCerrar();
        return;
      }
      setErrores(resultado.errores ?? {});
      setMensaje(resultado.mensaje);
    });
  }

  return (
    <form
      onSubmit={enviar}
      className="mt-4 space-y-3 rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-want-navy">
          Registrar gestión · {canal.nombre}
        </p>
        <button
          type="button"
          onClick={onCerrar}
          disabled={enviando}
          className="text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>

      <div>
        <textarea
          aria-label="Observación de la gestión"
          className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-want-navy focus:ring-2 focus:ring-want-navy/20"
          placeholder="Describa el resultado de la interacción con el asociado..."
          value={observacion}
          onChange={(evento) => setObservacion(evento.target.value)}
          maxLength={2000}
          autoFocus
          required
        />
        {errores.observacion ? (
          <p className="mt-1 text-xs text-want-rojo">{errores.observacion}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Etapa en la que se realizó la gestión"
          className={cn(CLASE_CAMPO, "h-10 w-auto")}
          value={etapa}
          onChange={(evento) => setEtapa(evento.target.value)}
        >
          {ETAPAS.map((valor) => (
            <option key={valor} value={valor}>
              Etapa: {ETIQUETA_ETAPA[valor]}
            </option>
          ))}
        </select>

        <button type="submit" disabled={enviando} className={BOTON_PRIMARIO}>
          {enviando ? "Registrando..." : "Registrar gestión"}
        </button>
      </div>

      {errores.etapa ? (
        <p className="text-xs text-want-rojo">{errores.etapa}</p>
      ) : null}

      <ErrorGeneral mensaje={mensaje} />
    </form>
  );
}
