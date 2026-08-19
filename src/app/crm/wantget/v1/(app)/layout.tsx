import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionWatcher } from "@/components/layout/session-watcher";
import { obtenerContextoUsuario } from "@/lib/contexto-usuario";
import { RUTA_SIGN_IN } from "@/lib/autorizacion";

/**
 * Layout de la aplicación autenticada: sidebar fijo + área de contenido.
 *
 * El contexto se resuelve una sola vez acá; `obtenerContextoUsuario` está
 * memoizado por request, así que las pages que lo vuelvan a pedir para su
 * encabezado no disparan otra consulta.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contexto = await obtenerContextoUsuario();
  if (!contexto) redirect(RUTA_SIGN_IN);

  return (
    // Shell de altura fija. h-svh le da al contenedor una altura definida
    // (min-h-svh sola no alcanza: el h-full del sidebar resuelve a auto contra
    // un padre sin height). Con esto el sidebar queda anclado al viewport, con
    // su pie visible, y el scroll del contenido vive en el SidebarInset.
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar contexto={contexto} />
      <SidebarInset className="min-h-0 overflow-y-auto bg-want-fondo">
        {children}
      </SidebarInset>
      <SessionWatcher />
      {/* RN-02: crear o editar confirma con un mensaje. */}
      <Toaster position="bottom-right" richColors closeButton />
    </SidebarProvider>
  );
}
