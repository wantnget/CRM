import { PageHeader } from "@/components/layout/page-header";
import { VistaLlamadas } from "@/components/llamadas/vista-llamadas";
import { exigirAcceso } from "@/lib/autorizacion";
import {
  obtenerContactosLlamada,
  obtenerHistorialLlamadas,
} from "@/lib/consultas/llamadas";
import { BASE_CRM } from "@/lib/navegacion";

const RUTA = `${BASE_CRM}/comunicacion/llamadas`;

export default async function LlamadasPage() {
  const contexto = await exigirAcceso(RUTA);

  const [contactos, historial] = contexto.compania
    ? await Promise.all([
        obtenerContactosLlamada({
          companiaId: contexto.compania.id,
          gestorId: contexto.usuario.id,
        }),
        obtenerHistorialLlamadas({
          companiaId: contexto.compania.id,
          gestorId: contexto.usuario.id,
        }),
      ])
    : [[], []];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader contexto={contexto} titulo="Llamadas" />

      <div className="min-h-0 flex-1">
        <VistaLlamadas contactos={contactos} historial={historial} />
      </div>
    </div>
  );
}
