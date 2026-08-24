"use client";

import { useMemo, useState } from "react";
import { ListaChats } from "@/components/whatsapp/lista-chats";
import { Conversacion } from "@/components/whatsapp/conversacion";
import { NuevaConversacionDialog } from "@/components/whatsapp/nueva-conversacion-dialog";
import { useRefrescoPeriodico } from "@/hooks/use-refresco-periodico";
import type { Chat, ContactoWhatsapp } from "@/lib/consultas/whatsapp";

/** Los entrantes llegan por webhook, así que la pantalla los busca sola. */
const SEGUNDOS_REFRESCO = 8;

export function VistaWhatsapp({
  chats,
  contactos,
}: {
  chats: Chat[];
  contactos: ContactoWhatsapp[];
}) {
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  useRefrescoPeriodico(SEGUNDOS_REFRESCO);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (chat) =>
        chat.nombre.toLowerCase().includes(q) || chat.telefono.includes(q),
    );
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
          accion={<NuevaConversacionDialog contactos={contactos} />}
        />
      </div>

      <div className="min-h-0">
        <Conversacion
          chat={seleccionado}
          onVolver={() => setSeleccionadoId(null)}
          onEliminada={() => setSeleccionadoId(null)}
        />
      </div>
    </div>
  );
}
