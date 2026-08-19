"use client";

import { useMemo, useState } from "react";
import { BarraCorreo, type FiltroCorreo } from "@/components/correo/barra-correo";
import { CarpetasCorreo, ETIQUETA_CARPETA, type Carpeta } from "@/components/correo/carpetas-correo";
import { ListaCorreos } from "@/components/correo/lista-correos";
import { LectorCorreo } from "@/components/correo/lector-correo";
import { RedactarCorreoDialog } from "@/components/correo/redactar-correo-dialog";
import type { Correo } from "@/lib/consultas/correo";

export function VistaCorreo({ correos }: { correos: Correo[] }) {
  const [carpeta, setCarpeta] = useState<Carpeta>("entrada");
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(
    correos[0]?.id ?? null,
  );
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroCorreo>("todos");

  // Solo "entrada" tiene correos de ejemplo: es la única bandeja que existe en
  // el prototipo de datos. Las demás carpetas quedan vacías a propósito.
  const correosDeCarpeta = useMemo(
    () => (carpeta === "entrada" ? correos : []),
    [carpeta, correos],
  );

  const filtrados = useMemo(() => {
    return correosDeCarpeta.filter((correo) => {
      if (filtro === "no-leidos" && correo.leido) return false;
      if (!busqueda.trim()) return true;
      const q = busqueda.trim().toLowerCase();
      return (
        correo.remitente.toLowerCase().includes(q) ||
        correo.asunto.toLowerCase().includes(q) ||
        correo.extracto.toLowerCase().includes(q)
      );
    });
  }, [correosDeCarpeta, filtro, busqueda]);

  const seleccionado =
    correosDeCarpeta.find((c) => c.id === seleccionadoId) ??
    filtrados[0] ??
    null;

  return (
    <div className="grid h-full min-h-0 items-stretch lg:grid-cols-[3.5rem_20rem_1fr]">
      <CarpetasCorreo
        carpeta={carpeta}
        onCarpetaChange={(siguiente) => {
          setCarpeta(siguiente);
          setSeleccionadoId(null);
        }}
      />

      <div className="flex min-h-0 flex-col overflow-hidden border-r border-border bg-card">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <h2 className="text-sm font-medium text-foreground">
            {ETIQUETA_CARPETA[carpeta]}
          </h2>
          <span className="text-xs text-muted-foreground">
            {filtrados.length} de {correosDeCarpeta.length}
          </span>
        </div>

        <div className="border-t border-border px-4 py-3">
          <RedactarCorreoDialog />
        </div>

        <div className="border-t border-border px-4 py-3">
          <BarraCorreo
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            filtro={filtro}
            onFiltroChange={setFiltro}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-border">
          <ListaCorreos
            correos={filtrados}
            seleccionadoId={seleccionado?.id ?? null}
            onSeleccionar={setSeleccionadoId}
          />
        </div>
      </div>

      <div className="min-h-0">
        <LectorCorreo correo={seleccionado} />
      </div>
    </div>
  );
}
