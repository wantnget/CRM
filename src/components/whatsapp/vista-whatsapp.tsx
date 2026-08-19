"use client";

import { useMemo, useState } from "react";
import { ListaChats } from "@/components/whatsapp/lista-chats";
import { Conversacion } from "@/components/whatsapp/conversacion";
import type { Chat } from "@/lib/consultas/whatsapp";

export function VistaWhatsapp({ chats }: { chats: Chat[] }) {
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(
    chats[0]?.id ?? null,
  );
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return chats;
    const q = busqueda.trim().toLowerCase();
    return chats.filter((chat) => chat.nombre.toLowerCase().includes(q));
  }, [chats, busqueda]);

  const seleccionado = chats.find((c) => c.id === seleccionadoId) ?? null;

  return (
    <div className="grid h-full min-h-0 items-stretch lg:grid-cols-[20rem_1fr]">
      <div className="min-h-0 border-r border-border">
        <ListaChats
          chats={filtrados}
          seleccionadoId={seleccionado?.id ?? null}
          onSeleccionar={setSeleccionadoId}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
        />
      </div>

      <div className="min-h-0">
        <Conversacion chat={seleccionado} />
      </div>
    </div>
  );
}
