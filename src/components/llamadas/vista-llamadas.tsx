"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ListaContactos } from "@/components/llamadas/lista-contactos";
import { PanelLlamada } from "@/components/llamadas/panel-llamada";
import { formatoFechaHora } from "@/lib/formato";
import type { ContactoLlamada, LlamadaRegistrada } from "@/lib/consultas/llamadas";

export function VistaLlamadas({
  contactos,
  historial,
}: {
  contactos: ContactoLlamada[];
  historial: LlamadaRegistrada[];
}) {
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [enLlamada, setEnLlamada] = useState(false);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return contactos;
    return contactos.filter(
      (c) =>
        c.asociadoNombre.toLowerCase().includes(q) ||
        c.asociadoTelefono.includes(q),
    );
  }, [contactos, busqueda]);

  const seleccionado =
    contactos.find((c) => c.oportunidadId === seleccionadoId) ?? null;

  const historialDelContacto = useMemo(() => {
    if (!seleccionado) return historial;
    return historial.filter((l) => l.oportunidadId === seleccionado.oportunidadId);
  }, [historial, seleccionado]);

  return (
    <div className="grid h-full min-h-0 items-stretch lg:grid-cols-[20rem_1fr]">
      <div className="min-h-0 border-r border-border">
        <ListaContactos
          contactos={filtrados}
          seleccionadoId={seleccionadoId}
          onSeleccionar={setSeleccionadoId}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
        />
      </div>

      <div className="flex min-h-0 flex-col overflow-y-auto p-5">
        {seleccionado ? (
          <div className="flex min-h-0 flex-1 flex-col gap-5">
            {enLlamada ? null : (
              <button
                type="button"
                onClick={() => setSeleccionadoId(null)}
                className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                Volver a contactos
              </button>
            )}

            <PanelLlamada
              key={seleccionado.oportunidadId}
              contacto={seleccionado}
              onEnLlamadaChange={setEnLlamada}
            />

            {enLlamada ? null : (
              <section>
                <h3 className="mb-3 text-sm font-medium text-foreground">
                  Llamadas de este asociado
                </h3>
                <HistorialLlamadas llamadas={historialDelContacto} />
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-10 text-center">
              <Image
                src="/call.svg"
                alt=""
                width={320}
                height={207}
                className="h-auto w-full max-w-xs"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Selecciona un asociado
                </p>
                <p className="text-sm text-muted-foreground">
                  Elige un contacto de la lista para llamarlo.
                </p>
              </div>
            </div>

            <section>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Últimas llamadas
              </h3>
              <HistorialLlamadas llamadas={historial} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function HistorialLlamadas({ llamadas }: { llamadas: LlamadaRegistrada[] }) {
  if (llamadas.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
        Todavía no hay llamadas registradas.
      </p>
    );
  }

  return (
    <ol className="overflow-hidden rounded-xl border border-border bg-card">
      {llamadas.map((llamada) => (
        <li
          key={llamada.id}
          className="flex items-start gap-3 border-b border-border px-4 py-3.5 last:border-b-0"
        >
          <Avatar size="sm" className="mt-0.5">
            <AvatarFallback className="bg-want-navy/10 text-want-navy">
              {llamada.iniciales}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="truncate text-sm font-medium text-foreground">
                {llamada.asociadoNombre}
              </p>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatoFechaHora(llamada.fechaHora)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{llamada.productoNombre}</p>
            {llamada.observacion ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {llamada.observacion}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
