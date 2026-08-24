"use client";

import { ChevronDown, ChevronUp, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRef, useState, useTransition } from "react";
import { enviarCorreoOportunidad } from "@/app/crm/wantget/v1/(app)/comunicacion/email/acciones";
import { EditorCuerpoCorreo } from "@/components/correo/editor-cuerpo-correo";
import { ErrorGeneral } from "@/components/form/campos";
import {
  descartarBorrador,
  guardarBorrador,
  type BorradorCorreo,
} from "@/hooks/use-borradores-correo";
import { cn } from "@/lib/utils";
import type { DestinatarioCorreo } from "@/lib/consultas/correo";

export function RedactarCorreoDialog({
  destinatarios,
  gestorId,
  borrador,
  onCerrar,
}: {
  destinatarios: DestinatarioCorreo[];
  gestorId: string;
  borrador: BorradorCorreo | null;
  onCerrar: () => void;
}) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [minimizado, setMinimizado] = useState(false);
  const [oportunidadId, setOportunidadId] = useState(
    borrador?.oportunidadId ?? destinatarios[0]?.oportunidadId ?? "",
  );
  const [asunto, setAsunto] = useState(borrador?.asunto ?? "");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const borradorId = borrador?.id ?? null;

  function cerrarGuardando() {
    const cuerpo = editorRef.current?.innerText.trim() ?? "";

    if (asunto.trim() || cuerpo) {
      guardarBorrador(gestorId, {
        id: borradorId ?? crypto.randomUUID(),
        oportunidadId,
        asunto,
        cuerpo,
      });
      toast("Borrador guardado");
    } else if (borradorId) {
      descartarBorrador(gestorId, borradorId);
    }

    onCerrar();
  }

  function descartar() {
    if (borradorId) descartarBorrador(gestorId, borradorId);
    onCerrar();
  }

  function enviar() {
    const cuerpo = editorRef.current?.innerText.trim() ?? "";
    if (!oportunidadId) {
      setMensaje("Selecciona un destinatario");
      return;
    }
    if (!asunto.trim()) {
      setMensaje("El asunto es obligatorio");
      return;
    }
    if (!cuerpo) {
      setMensaje("Escribe un mensaje antes de enviar");
      return;
    }

    setMensaje(null);
    iniciar(async () => {
      const resultado = await enviarCorreoOportunidad({ oportunidadId, asunto, cuerpo });
      if (!resultado.ok) {
        setMensaje(resultado.mensaje);
        return;
      }

      if (borradorId) descartarBorrador(gestorId, borradorId);
      toast("Correo enviado");
      router.refresh();
      onCerrar();
    });
  }

  return (
    <div
      role="dialog"
      aria-label={borrador ? "Continuar borrador" : "Correo nuevo"}
      className={cn(
        "fixed right-6 bottom-0 z-50 flex w-[26rem] flex-col overflow-hidden rounded-t-xl border border-border bg-card shadow-2xl",
        minimizado ? "h-11" : "h-[30rem]",
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 bg-want-navy px-4 py-2.5">
        <span className="text-sm font-medium text-white">
          {borrador ? "Borrador" : "Correo nuevo"}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimizado((v) => !v)}
            aria-label={minimizado ? "Expandir" : "Minimizar"}
            className="flex size-6 items-center justify-center rounded text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {minimizado ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={cerrarGuardando}
            aria-label="Cerrar"
            className="flex size-6 items-center justify-center rounded text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {minimizado ? null : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <label htmlFor="redactar-para" className="text-xs text-muted-foreground">
              Para
            </label>
            <select
              id="redactar-para"
              value={oportunidadId}
              onChange={(e) => setOportunidadId(e.target.value)}
              className="h-7 flex-1 bg-transparent text-sm text-foreground outline-none"
            >
              {destinatarios.map((d) => (
                <option key={d.oportunidadId} value={d.oportunidadId}>
                  {d.asociadoNombre} · {d.productoNombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <label htmlFor="redactar-asunto" className="text-xs text-muted-foreground">
              Asunto
            </label>
            <input
              id="redactar-asunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Asunto del correo"
              className="h-7 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <EditorCuerpoCorreo
            ref={editorRef}
            placeholder="Escribe tu mensaje..."
            contenidoInicial={borrador?.cuerpo}
          />

          {mensaje ? (
            <div className="px-3 pt-2">
              <ErrorGeneral mensaje={mensaje} />
            </div>
          ) : null}

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={descartar}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={enviar}
              disabled={enviando}
              className="flex items-center gap-1.5 rounded-lg bg-want-navy px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-want-navy/90 disabled:opacity-50"
            >
              <Send className="size-3.5" />
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
