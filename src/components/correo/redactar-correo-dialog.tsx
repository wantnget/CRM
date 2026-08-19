"use client";

import { ChevronDown, ChevronUp, PenSquare, X } from "lucide-react";
import { useRef, useState } from "react";
import { EditorCuerpoCorreo } from "@/components/correo/editor-cuerpo-correo";
import { cn } from "@/lib/utils";

/**
 * Correo nuevo, en una ventana flotante anclada abajo a la derecha, como en
 * Gmail: no bloquea el resto de la bandeja y se puede minimizar. Es solo UI:
 * "Enviar" cierra la ventana y limpia el borrador, sin mandar nada de verdad.
 */
export function RedactarCorreoDialog() {
  const [abierto, setAbierto] = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [para, setPara] = useState("");
  const [asunto, setAsunto] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  function abrir() {
    setAbierto(true);
    setMinimizado(false);
  }

  function cerrar() {
    setPara("");
    setAsunto("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    setAbierto(false);
    setMinimizado(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="flex items-center gap-2 rounded-lg bg-want-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-want-navy/90"
      >
        <PenSquare className="size-4" />
        Redactar
      </button>

      {abierto ? (
        <div
          role="dialog"
          aria-label="Correo nuevo"
          className={cn(
            "fixed right-6 bottom-0 z-50 flex w-[26rem] flex-col overflow-hidden rounded-t-xl border border-border bg-card shadow-2xl",
            minimizado ? "h-11" : "h-[28rem]",
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 bg-want-navy px-4 py-2.5">
            <span className="text-sm font-medium text-white">Correo nuevo</span>
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
                onClick={cerrar}
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
                <input
                  id="redactar-para"
                  value={para}
                  onChange={(e) => setPara(e.target.value)}
                  placeholder="destinatario@correo.com"
                  className="h-7 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
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

              <EditorCuerpoCorreo ref={editorRef} placeholder="Escribe tu mensaje..." />

              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-3 py-2">
                <button
                  type="button"
                  onClick={cerrar}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={cerrar}
                  className="rounded-lg bg-want-navy px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-want-navy/90"
                >
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
