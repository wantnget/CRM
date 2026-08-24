"use client";

import { SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMemo, useState, useTransition } from "react";
import { eliminarCorreo } from "@/app/crm/wantget/v1/(app)/comunicacion/email/acciones";
import { BarraCorreo } from "@/components/correo/barra-correo";
import { CarpetasCorreo, ETIQUETA_CARPETA, type Carpeta } from "@/components/correo/carpetas-correo";
import { ListaCorreos } from "@/components/correo/lista-correos";
import { LectorCorreo } from "@/components/correo/lector-correo";
import { RedactarCorreoDialog } from "@/components/correo/redactar-correo-dialog";
import { useBorradoresCorreo, type BorradorCorreo } from "@/hooks/use-borradores-correo";
import { inicialesDe } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { Correo, DestinatarioCorreo } from "@/lib/consultas/correo";

export function VistaCorreo({
  correos,
  destinatarios,
  gestorId,
}: {
  correos: Correo[];
  destinatarios: DestinatarioCorreo[];
  gestorId: string;
}) {
  const router = useRouter();
  const [carpeta, setCarpeta] = useState<Carpeta>("entrada");
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [redactando, setRedactando] = useState<{ borrador: BorradorCorreo | null } | null>(null);
  const [, iniciar] = useTransition();
  const borradores = useBorradoresCorreo(gestorId);

  const borradoresComoCorreo = useMemo<Correo[]>(() => {
    const porOportunidad = new Map(destinatarios.map((d) => [d.oportunidadId, d]));

    return borradores.map((b) => {
      const destino = porOportunidad.get(b.oportunidadId);
      const nombre = destino?.asociadoNombre ?? "Sin destinatario";
      return {
        id: b.id,
        oportunidadId: b.oportunidadId,
        remitente: nombre,
        correoRemitente: destino?.asociadoEmail ?? "",
        iniciales: inicialesDe(nombre),
        asunto: b.asunto.trim() || "(sin asunto)",
        extracto: b.cuerpo,
        cuerpo: b.cuerpo,
        fechaHora: new Date(b.guardadoEn),
        direccion: "SALIDA",
        eliminado: false,
      };
    });
  }, [borradores, destinatarios]);

  const correosDeCarpeta = useMemo(() => {
    if (carpeta === "borradores") return borradoresComoCorreo;
    if (carpeta === "papelera") return correos.filter((c) => c.eliminado);
    if (carpeta === "entrada") {
      return correos.filter((c) => c.direccion === "ENTRADA" && !c.eliminado);
    }
    if (carpeta === "enviados") {
      return correos.filter((c) => c.direccion === "SALIDA" && !c.eliminado);
    }
    return [];
  }, [carpeta, correos, borradoresComoCorreo]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return correosDeCarpeta;
    return correosDeCarpeta.filter(
      (correo) =>
        correo.remitente.toLowerCase().includes(q) ||
        correo.asunto.toLowerCase().includes(q) ||
        correo.extracto.toLowerCase().includes(q),
    );
  }, [correosDeCarpeta, busqueda]);

  const seleccionado =
    carpeta === "borradores"
      ? null
      : correosDeCarpeta.find((c) => c.id === seleccionadoId) ?? null;

  function seleccionar(id: string) {
    if (carpeta === "borradores") {
      const borrador = borradores.find((b) => b.id === id);
      if (borrador) setRedactando({ borrador });
      return;
    }
    setSeleccionadoId(id);
  }

  function eliminar(id: string) {
    setSeleccionadoId(null);
    iniciar(async () => {
      const resultado = await eliminarCorreo({ gestionId: id });
      if (!resultado.ok) {
        toast.error(resultado.mensaje);
        return;
      }
      toast("Correo movido a la papelera");
      router.refresh();
    });
  }

  return (
    <div className="grid h-full min-h-0 items-stretch lg:grid-cols-[3.5rem_20rem_1fr]">
      <CarpetasCorreo
        carpeta={carpeta}
        className={cn(seleccionado && "hidden lg:flex")}
        onCarpetaChange={(siguiente) => {
          setCarpeta(siguiente);
          setSeleccionadoId(null);
        }}
      />

      <div
        className={cn(
          "flex min-h-0 flex-col overflow-hidden border-r border-border bg-card",
          seleccionado && "hidden lg:flex",
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <h2 className="text-sm font-medium text-foreground">
            {ETIQUETA_CARPETA[carpeta]}
          </h2>
          <span className="text-xs text-muted-foreground">
            {filtrados.length} de {correosDeCarpeta.length}
          </span>
        </div>

        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <BarraCorreo busqueda={busqueda} onBusquedaChange={setBusqueda} />
          <button
            type="button"
            onClick={() => setRedactando({ borrador: null })}
            disabled={destinatarios.length === 0}
            aria-label="Redactar"
            title={
              destinatarios.length === 0
                ? "No tienes asociados con una prospección abierta y correo registrado"
                : "Redactar"
            }
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SquarePen className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-border">
          <ListaCorreos
            correos={filtrados}
            carpeta={carpeta}
            totalEnCarpeta={correosDeCarpeta.length}
            seleccionadoId={seleccionado?.id ?? null}
            onSeleccionar={seleccionar}
          />
        </div>
      </div>

      <div className={cn("min-h-0", !seleccionado && "hidden lg:block")}>
        <LectorCorreo
          correo={seleccionado}
          carpeta={carpeta}
          onVolver={() => setSeleccionadoId(null)}
          onEliminar={carpeta === "papelera" ? undefined : eliminar}
        />
      </div>

      {redactando ? (
        <RedactarCorreoDialog
          key={redactando.borrador?.id ?? "nuevo"}
          destinatarios={destinatarios}
          gestorId={gestorId}
          borrador={redactando.borrador}
          onCerrar={() => setRedactando(null)}
        />
      ) : null}
    </div>
  );
}
