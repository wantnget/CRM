"use client";

import { MessageSquarePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { abrirConversacion } from "@/app/crm/wantget/v1/(app)/comunicacion/whatsapp/acciones";
import { BOTON_PRIMARIO, ErrorGeneral } from "@/components/form/campos";
import type { ContactoWhatsapp } from "@/lib/consultas/whatsapp";

/**
 * Inicio de conversación. WhatsApp no admite texto libre sin ventana abierta,
 * así que esto manda la plantilla aprobada y queda esperando la respuesta del
 * asociado.
 */
export function NuevaConversacionDialog({
  contactos,
}: {
  contactos: ContactoWhatsapp[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [asociadoId, setAsociadoId] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const disponibles = contactos.filter((c) => !c.conConversacion);

  function abrir() {
    setAsociadoId(disponibles[0]?.asociadoId ?? "");
    setMensaje(null);
    setAbierto(true);
  }

  function enviar() {
    if (!asociadoId) {
      setMensaje("Selecciona un asociado");
      return;
    }

    setMensaje(null);
    iniciar(async () => {
      const resultado = await abrirConversacion({ asociadoId });
      if (!resultado.ok) {
        setMensaje(resultado.mensaje);
        return;
      }

      toast("Mensaje de apertura enviado");
      setAbierto(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        disabled={disponibles.length === 0}
        aria-label="Nueva conversación"
        title={
          disponibles.length === 0
            ? "Ya tienes conversación con todos tus asociados con WhatsApp"
            : "Nueva conversación"
        }
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageSquarePlus className="size-4" />
      </button>

      {abierto ? (
        <div
          role="dialog"
          aria-label="Nueva conversación"
          className="fixed right-6 bottom-6 z-50 w-[22rem] space-y-3 rounded-xl border border-border bg-card p-4 shadow-2xl"
        >
          <div>
            <p className="text-sm font-medium text-foreground">
              Nueva conversación
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Se envía la plantilla de apertura. Podrás escribir libremente
              cuando el asociado responda.
            </p>
          </div>

          <select
            aria-label="Asociado"
            value={asociadoId}
            onChange={(e) => setAsociadoId(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-want-navy focus:ring-2 focus:ring-want-navy/20"
          >
            {disponibles.map((contacto) => (
              <option key={contacto.asociadoId} value={contacto.asociadoId}>
                {contacto.nombre} · {contacto.telefono}
              </option>
            ))}
          </select>

          <ErrorGeneral mensaje={mensaje} />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={enviar}
              disabled={enviando}
              className={BOTON_PRIMARIO}
            >
              {enviando ? "Enviando..." : "Enviar plantilla"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
