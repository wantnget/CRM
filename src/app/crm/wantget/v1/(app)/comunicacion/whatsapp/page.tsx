import { PageHeader } from "@/components/layout/page-header";
import { VistaWhatsapp } from "@/components/whatsapp/vista-whatsapp";
import { exigirAcceso } from "@/lib/autorizacion";
import { obtenerChatsMock } from "@/lib/consultas/whatsapp";
import { BASE_CRM } from "@/lib/navegacion";

/**
 * WhatsApp del Gestor. Prototipo de solo interfaz: los chats se arman con
 * datos de ejemplo (lib/consultas/whatsapp.ts), sin integración con la API de
 * WhatsApp todavía.
 */

const RUTA = `${BASE_CRM}/comunicacion/whatsapp`;

export default async function WhatsappPage() {
  const contexto = await exigirAcceso(RUTA);
  const chats = obtenerChatsMock();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader contexto={contexto} titulo="WhatsApp" />

      <div className="min-h-0 flex-1">
        <VistaWhatsapp chats={chats} />
      </div>
    </div>
  );
}
