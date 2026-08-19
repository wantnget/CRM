"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/use-logout";
import { ETIQUETA_ROL, gruposDeRol, type ItemNavegacion } from "@/lib/navegacion";
import type { ContextoUsuario } from "@/lib/contexto-usuario";

/**
 * Sidebar de navegación por rol.
 *
 * Los ítems no se declaran acá: salen de lib/navegacion.ts, que es la misma
 * fuente que usa la autorización. Así el menú no puede ofrecer algo a lo que el
 * rol no tenga acceso.
 */

function estaActivo(pathname: string, item: ItemNavegacion) {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function tieneActivo(pathname: string, item: ItemNavegacion): boolean {
  return (item.subitems ?? []).some((hijo) => estaActivo(pathname, hijo));
}

export function AppSidebar({ contexto }: { contexto: ContextoUsuario }) {
  const pathname = usePathname();
  const { logout, isPending } = useLogout();
  const grupos = gruposDeRol(contexto.rol.codigo);

  // Ítems de acordeón expandidos por su href. Uno con la ruta activa dentro
  // arranca abierto para que el usuario vea dónde está parado.
  const [abiertos, setAbiertos] = useState<Set<string>>(
    () =>
      new Set(
        grupos
          .flatMap((g) => g.items)
          .filter((item) => item.subitems && tieneActivo(pathname, item))
          .map((item) => item.href),
      ),
  );

  function alternar(href: string) {
    setAbiertos((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(href)) siguiente.delete(href);
      else siguiente.add(href);
      return siguiente;
    });
  }

  // El prototipo muestra la oficina para los roles con alcance de oficina y la
  // razón social para los demás. ADMIN_GENERAL opera fuera de toda compañía
  // (ck_usuario_admin_general_sin_compania), así que no tiene ninguna de las dos.
  const subtitulo =
    contexto.oficina?.nombre ??
    contexto.compania?.razonSocial ??
    "Todas las compañías";

  return (
    <Sidebar collapsible="none" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-3 px-5 pt-6 pb-5">
        <Image
          src="/logos/imagen.png"
          alt="WANT Tech 4 All"
          width={112}
          height={34}
          className="h-auto w-[112px] brightness-0 invert"
          priority
        />

        <span className="w-fit rounded-full border border-want-naranja/60 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-want-naranja">
          {ETIQUETA_ROL[contexto.rol.codigo]}
        </span>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {grupos.length === 0 ? (
          <p className="px-3 py-2 text-xs leading-relaxed text-sidebar-foreground/60">
            Este rol todavía no tiene módulos asignados.
          </p>
        ) : null}

        {grupos.map((grupo) => (
          <SidebarGroup key={grupo.titulo}>
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-widest text-sidebar-foreground/50 uppercase">
              {grupo.titulo}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.items.map((item) => {
                  const activo = estaActivo(pathname, item);

                  // Ítem de acordeón: no navega por sí mismo, solo despliega
                  // sus sub-ítems (p. ej. "Comunicación" → Email / WhatsApp).
                  if (item.subitems) {
                    const abierto = abiertos.has(item.href);
                    const activoPorHijo = tieneActivo(pathname, item);

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          type="button"
                          aria-expanded={abierto}
                          onClick={() => alternar(item.href)}
                          className={cn(
                            "h-auto py-2 pl-3 font-medium",
                            activoPorHijo &&
                              "text-want-navy hover:text-want-navy",
                          )}
                        >
                          <span className="flex-1 whitespace-normal text-left">
                            {item.etiqueta}
                          </span>
                          <ChevronDown
                            aria-hidden
                            className={cn(
                              "size-4 shrink-0 transition-transform",
                              abierto && "rotate-180",
                            )}
                          />
                        </SidebarMenuButton>

                        {abierto ? (
                          <SidebarMenuSub>
                            {item.subitems.map((hijo) => {
                              const hijoActivo = estaActivo(pathname, hijo);
                              return (
                                <SidebarMenuSubItem key={hijo.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={hijoActivo}
                                  >
                                    <Link href={hijo.href}>
                                      {hijo.etiqueta}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        ) : null}
                      </SidebarMenuItem>
                    );
                  }

                  // Fase 2: se ve, no navega. El bloqueo real está en
                  // puedeAcceder() y en que la ruta no existe.
                  if (item.fase2) {
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          disabled
                          className="h-auto cursor-not-allowed items-start gap-2 py-2 text-sidebar-foreground/40 hover:bg-transparent"
                        >
                          <span className="flex-1 whitespace-normal">
                            {item.etiqueta}
                          </span>
                          <span className="mt-0.5 rounded border border-sidebar-foreground/25 px-1 text-[10px] leading-4 font-medium">
                            V2
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={activo}
                        // El estado activo no puede salir de --sidebar-accent:
                        // shadcn usa ese token también para :hover, así que
                        // quedarían idénticos. Se pinta explícitamente.
                        className={cn(
                          "relative h-auto py-2 pl-3 font-medium",
                          activo &&
                            "bg-white text-want-navy hover:bg-white hover:text-want-navy",
                        )}
                      >
                        <Link href={item.href}>
                          {activo ? (
                            <span
                              aria-hidden
                              className="absolute top-1.5 bottom-1.5 -left-2 w-[3px] rounded-full bg-want-naranja"
                            />
                          ) : null}
                          <span className="whitespace-normal">
                            {item.etiqueta}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-0 border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-want-naranja text-xs font-semibold text-want-navy">
            {contexto.usuario.iniciales}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
              {contexto.usuario.nombreCompleto}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {subtitulo}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={isPending}
            className={cn(
              "shrink-0 rounded-md border border-sidebar-border px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground transition",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <span className="flex items-center gap-1.5">
              <LogOut className="size-3.5" />
              Salir
            </span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
