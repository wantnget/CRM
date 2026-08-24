"use client";

import { Reply, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRef, useState, useTransition } from "react";
import { enviarCorreoOportunidad } from "@/app/crm/wantget/v1/(app)/comunicacion/email/acciones";
import { ErrorGeneral } from "@/components/form/campos";
import { EditorCuerpoCorreo } from "@/components/correo/editor-cuerpo-correo";

export function ComposerCorreo({
  oportunidadId,
  destinatario,
  asuntoBase,
}: {
  oportunidadId: string;
  destinatario: string;
  asuntoBase: string;
}) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [expandido, setExpandido] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const asunto = `Re: ${asuntoBase}`;

  function enviar() {
    const cuerpo = editorRef.current?.innerText.trim() ?? "";
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

      if (editorRef.current) editorRef.current.innerHTML = "";
      toast("Correo enviado");
      router.refresh();
    });
  }

  if (!expandido) {
    return (
      <button
        type="button"
        onClick={() => setExpandido(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm text-foreground transition hover:bg-muted"
      >
        <Reply className="size-4" />
        Responder
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <p className="truncate text-xs text-muted-foreground">
          Para: <span className="text-foreground">{destinatario}</span> · Asunto:{" "}
          <span className="text-foreground">{asunto}</span>
        </p>
        <button
          type="button"
          onClick={() => setExpandido(false)}
          aria-label="Cerrar respuesta"
          className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <EditorCuerpoCorreo ref={editorRef} placeholder="Escribe una respuesta..." />

      {mensaje ? (
        <div className="px-3 pt-2">
          <ErrorGeneral mensaje={mensaje} />
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
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
  );
}
