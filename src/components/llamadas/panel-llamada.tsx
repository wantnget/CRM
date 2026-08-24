"use client";

import { Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { registrarLlamada } from "@/app/crm/wantget/v1/(app)/comunicacion/llamadas/acciones";
import { LlamadaActiva } from "@/components/llamadas/llamada-activa";
import { BOTON_PRIMARIO, ErrorGeneral } from "@/components/form/campos";
import { useSoftphone } from "@/hooks/use-softphone";
import { formatoDuracion } from "@/lib/formato";
import type { ContactoLlamada } from "@/lib/consultas/llamadas";

export function PanelLlamada({
  contacto,
  onEnLlamadaChange,
}: {
  contacto: ContactoLlamada;
  /** Avisa al contenedor para que la llamada ocupe el panel completo. */
  onEnLlamadaChange?: (enLlamada: boolean) => void;
}) {
  const router = useRouter();
  const {
    estado,
    duracion,
    duracionFinal,
    silenciado,
    llamar,
    colgar,
    alternarSilencio,
  } = useSoftphone();
  const [enPantalla, setEnPantalla] = useState(false);
  const [porRegistrar, setPorRegistrar] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, iniciar] = useTransition();

  function iniciarLlamada() {
    setObservacion("");
    setMensaje(null);
    setPorRegistrar(false);
    setEnPantalla(true);
    onEnLlamadaChange?.(true);
    llamar(contacto.asociadoTelefono);
  }

  function cerrarPantalla() {
    setEnPantalla(false);
    setPorRegistrar(true);
    onEnLlamadaChange?.(false);
  }

  function guardar() {
    if (!observacion.trim()) {
      setMensaje("Describe el resultado de la llamada");
      return;
    }

    setMensaje(null);
    iniciar(async () => {
      const resultado = await registrarLlamada({
        oportunidadId: contacto.oportunidadId,
        duracionSegundos: duracionFinal,
        observacion,
      });

      if (!resultado.ok) {
        setMensaje(resultado.mensaje);
        return;
      }

      toast("Llamada registrada");
      setObservacion("");
      setPorRegistrar(false);
      router.refresh();
    });
  }

  if (enPantalla) {
    return (
      <LlamadaActiva
        nombre={contacto.asociadoNombre}
        telefono={contacto.asociadoTelefono}
        iniciales={contacto.iniciales}
        estado={estado}
        duracion={duracion}
        silenciado={silenciado}
        onSilenciar={alternarSilencio}
        onColgar={colgar}
        onCerrar={cerrarPantalla}
      />
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-want-navy/10 text-want-navy">
          <Phone aria-hidden className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {contacto.asociadoNombre}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {contacto.asociadoTelefono} · {contacto.productoNombre}
          </p>
        </div>
      </div>

      {!porRegistrar ? (
        <button type="button" onClick={iniciarLlamada} className={BOTON_PRIMARIO}>
          <Phone aria-hidden className="mr-1.5 size-4" />
          Llamar
        </button>
      ) : null}

      {porRegistrar ? (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Duración de la llamada: {formatoDuracion(duracionFinal)}
          </p>

          <textarea
            aria-label="Resultado de la llamada"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Describe el resultado de la llamada..."
            maxLength={2000}
            autoFocus
            className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-want-navy focus:ring-2 focus:ring-want-navy/20"
          />

          <ErrorGeneral mensaje={mensaje} />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className={BOTON_PRIMARIO}
            >
              {guardando ? "Registrando..." : "Registrar llamada"}
            </button>
            <button
              type="button"
              onClick={() => setPorRegistrar(false)}
              className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              Descartar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
