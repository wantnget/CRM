import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
    <SidebarProvider className="min-h-full">
      <AppSidebar contexto={contexto} />
      <SidebarInset className="bg-want-fondo">{children}</SidebarInset>
      <SessionWatcher />
    </SidebarProvider>
  );
}
