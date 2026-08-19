"use client";

import { useRef, useState } from "react";
import { EditorCuerpoCorreo } from "@/components/correo/editor-cuerpo-correo";
import { cn } from "@/lib/utils";

/**
 * Composer de respuesta a un correo abierto. Es solo UI: "Enviar" no manda
 * nada a ningún lado todavía, solo limpia el borrador.
 */
export function ComposerCorreo({
  destinatario,
  asuntoBase,
}: {
  destinatario: string;
  asuntoBase: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [enviado, setEnviado] = useState(false);

  function enviar() {
    setEnviado(true);
    if (editorRef.current) editorRef.current.innerHTML = "";
    window.setTimeout(() => setEnviado(false), 2500);
  }

  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
        Para: <span className="text-foreground">{destinatario}</span> · Asunto:{" "}
        <span className="text-foreground">Re: {asuntoBase}</span>
      </div>

      <EditorCuerpoCorreo ref={editorRef} placeholder="Escribe una respuesta..." />

      <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
        {enviado ? (
          <span className="text-xs text-want-verde">Correo enviado</span>
        ) : null}
        <button
          type="button"
          onClick={enviar}
          className={cn(
            "rounded-lg bg-want-navy px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-want-navy/90",
          )}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
