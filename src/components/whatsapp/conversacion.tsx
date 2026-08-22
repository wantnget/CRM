"use client";

import { ArrowLeft, Send, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import {
  eliminarConversacion,
  enviarMensaje,
} from "@/app/crm/wantget/v1/(app)/comunicacion/whatsapp/acciones";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ErrorGeneral } from "@/components/form/campos";
import { formatoFechaHora } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { Chat } from "@/lib/consultas/whatsapp";

export function Conversacion({
  chat,
  onVolver,
  onEliminada,
}: {
  chat: Chat | null;
  onVolver?: () => void;
  onEliminada?: () => void;
}) {
  return chat ? (
    <ConversacionActiva
      key={chat.id}
      chat={chat}
      onVolver={onVolver}
      onEliminada={onEliminada}
    />
  ) : (
    <SinChatSeleccionado />
  );
}

function SinChatSeleccionado() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-card px-6 text-center">
      <Image
        src="/chat.svg"
        alt=""
        width={320}
        height={207}
        className="h-auto w-full max-w-xs"
      />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Selecciona una conversación
        </p>
        <p className="text-sm text-muted-foreground">
          Elige un chat de la lista para ver los mensajes.
        </p>
      </div>
    </div>
  );
}

function ConversacionActiva({
  chat,
  onVolver,
  onEliminada,
}: {
  chat: Chat;
  onVolver?: () => void;
  onEliminada?: () => void;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, iniciar] = useTransition();

  const { ventanaAbierta } = chat;

  function enviar() {
    const cuerpo = texto.trim();
    if (!cuerpo) return;

    setMensajeError(null);
    iniciar(async () => {
      const resultado = await enviarMensaje({
        conversacionId: chat.id,
        cuerpo,
      });

      if (!resultado.ok) {
        setMensajeError(resultado.mensaje);
        return;
      }

      setTexto("");
      router.refresh();
    });
  }

  function eliminar() {
    iniciar(async () => {
      const resultado = await eliminarConversacion({ conversacionId: chat.id });
      if (!resultado.ok) {
        setMensajeError(resultado.mensaje);
        return;
      }

      setConfirmando(false);
      toast("Conversación eliminada");
      onEliminada?.();
      router.refresh();
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {onVolver ? (
          <button
            type="button"
            onClick={onVolver}
            title="Volver a los chats"
            aria-label="Volver a los chats"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
        ) : null}

        <Avatar size="sm">
          <AvatarFallback className="bg-want-navy/10 text-want-navy">
            {chat.iniciales}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {chat.nombre}
          </p>
          <p className="truncate text-xs text-muted-foreground">{chat.telefono}</p>
        </div>

        {confirmando ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted-foreground">
              ¿Eliminar la conversación?
            </span>
            <button
              type="button"
              onClick={eliminar}
              disabled={enviando}
              className="rounded-lg bg-want-rojo px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-want-rojo/90 disabled:opacity-50"
            >
              {enviando ? "Eliminando..." : "Eliminar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            title="Eliminar conversación"
            aria-label="Eliminar conversación"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <div
        className="flex-1 space-y-2 overflow-y-auto bg-muted/30 px-6 py-5"
        style={{
          // El velo va sobre el patrón para dejarlo apenas insinuado: a plena
          // opacidad compite con las burbujas y el chat se vuelve ilegible.
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.93), rgba(255,255,255,0.93)), url(/whatsapp-pattern.svg)",
          backgroundRepeat: "repeat",
          backgroundSize: "auto, 340px",
        }}
      >
        {chat.mensajes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Todavía no hay mensajes en esta conversación.
          </p>
        ) : (
          chat.mensajes.map((mensaje) => {
            const propio = mensaje.direccion === "SALIDA";
            return (
              <div
                key={mensaje.id}
                className={cn("flex", propio ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    propio
                      ? "rounded-br-sm bg-want-naranja text-want-navy"
                      : "rounded-bl-sm border border-border bg-card text-foreground",
                  )}
                >
                  <p className="whitespace-pre-line">{mensaje.cuerpo}</p>
                  <p
                    className={cn(
                      "mt-1 text-right text-[10px]",
                      propio ? "text-want-navy/60" : "text-muted-foreground",
                    )}
                  >
                    {formatoFechaHora(mensaje.fechaHora)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-2 border-t border-border bg-background px-3 py-3">
        {ventanaAbierta ? null : (
          <p className="px-1 text-xs text-muted-foreground">
            La ventana de 24 horas está cerrada. Podrás escribir cuando el
            asociado responda la plantilla de apertura.
          </p>
        )}

        {mensajeError ? <ErrorGeneral mensaje={mensajeError} /> : null}

        <div className="flex items-center gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") enviar();
            }}
            disabled={!ventanaAbierta || enviando}
            placeholder={
              ventanaAbierta ? "Escribe un mensaje" : "Esperando respuesta..."
            }
            className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-want-navy focus:ring-2 focus:ring-want-navy/20 disabled:bg-muted"
          />

          <button
            type="button"
            onClick={enviar}
            disabled={!ventanaAbierta || enviando}
            title="Enviar"
            aria-label="Enviar"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-want-verde text-white transition hover:bg-want-verde/90 disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
