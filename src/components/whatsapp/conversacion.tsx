"use client";

import { Paperclip, Send, Smile } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Chat, MensajeChat } from "@/lib/consultas/whatsapp";

/**
 * Panel de conversación, al estilo de WhatsApp Web: fondo con textura suave,
 * burbujas alineadas por autor, e input de envío que solo agrega el mensaje al
 * estado local (no hay integración con la API de WhatsApp).
 */
export function Conversacion({ chat }: { chat: Chat | null }) {
  return chat ? <ConversacionActiva key={chat.id} chat={chat} /> : <SinChatSeleccionado />;
}

function SinChatSeleccionado() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Selecciona un chat para ver la conversación.
    </div>
  );
}

function ConversacionActiva({ chat }: { chat: Chat }) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>(chat.mensajes);
  const [texto, setTexto] = useState("");

  function enviar() {
    if (!texto.trim()) return;
    const nuevo: MensajeChat = {
      id: `local-${Date.now()}`,
      autor: "gestor",
      texto: texto.trim(),
      hora: "Ahora",
    };
    setMensajes((previo) => [...previo, nuevo]);
    setTexto("");
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Avatar size="sm">
          <AvatarFallback className="bg-want-navy/10 text-want-navy">
            {chat.iniciales}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{chat.nombre}</p>
          <p className="truncate text-xs text-muted-foreground">
            {chat.enLinea ? "En línea" : chat.telefono}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 px-6 py-5">
        {mensajes.map((mensaje) => (
          <div
            key={mensaje.id}
            className={cn(
              "flex",
              mensaje.autor === "gestor" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                mensaje.autor === "gestor"
                  ? "rounded-br-sm bg-want-naranja/90 text-want-navy"
                  : "rounded-bl-sm border border-border bg-card text-foreground",
              )}
            >
              <p className="whitespace-pre-line">{mensaje.texto}</p>
              <p
                className={cn(
                  "mt-1 text-right text-[10px]",
                  mensaje.autor === "gestor"
                    ? "text-want-navy/60"
                    : "text-muted-foreground",
                )}
              >
                {mensaje.hora}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-background px-3 py-3">
        <button
          type="button"
          title="Adjuntar"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Paperclip className="size-4.5" />
        </button>
        <button
          type="button"
          title="Emoji"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Smile className="size-4.5" />
        </button>

        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") enviar();
          }}
          placeholder="Escribe un mensaje"
          className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-want-navy focus:ring-2 focus:ring-want-navy/20"
        />

        <button
          type="button"
          onClick={enviar}
          title="Enviar"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-want-verde text-white transition hover:bg-want-verde/90"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
