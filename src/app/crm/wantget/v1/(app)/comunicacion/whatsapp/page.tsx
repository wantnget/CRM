import { PageHeader } from "@/components/layout/page-header";
import { VistaWhatsapp } from "@/components/whatsapp/vista-whatsapp";
import { exigirAcceso } from "@/lib/autorizacion";
import { obtenerChats, obtenerContactosWhatsapp } from "@/lib/consultas/whatsapp";
import { BASE_CRM } from "@/lib/navegacion";

const RUTA = `${BASE_CRM}/comunicacion/whatsapp`;

export default async function WhatsappPage() {
  const contexto = await exigirAcceso(RUTA);

  const [chats, contactos] = contexto.compania
    ? await Promise.all([
        obtenerChats({
          companiaId: contexto.compania.id,
          gestorId: contexto.usuario.id,
        }),
        obtenerContactosWhatsapp({
          companiaId: contexto.compania.id,
          gestorId: contexto.usuario.id,
        }),
      ])
    : [[], []];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader contexto={contexto} titulo="WhatsApp" />

      <div className="min-h-0 flex-1">
        <VistaWhatsapp chats={chats} contactos={contactos} />
      </div>
    </div>
  );
}
