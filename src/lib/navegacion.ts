/**
 * Navegación por rol: fuente única de verdad.
 *
 * Los menús salen literalmente de `matriz_visibilidad.reglas[].menus` en
 * public/docs/estructura_bd_crm.json, que a su vez deriva de CRM.docx §1. De
 * este módulo se alimentan tres cosas, para que no puedan desincronizarse:
 *
 *   1. El render del sidebar (components/layout/app-sidebar.tsx)
 *   2. La autorización por ruta (lib/autorizacion.ts y proxy.ts)
 *   3. El destino al que cae el usuario después del login
 *
 * No importa nada de React ni de Prisma a propósito: el proxy corre en un
 * runtime restringido y necesita poder evaluar los permisos sin más.
 */

export const BASE_CRM = "/crm/wantget/v1";

export const ROLES = [
  "ADMIN_GENERAL",
  "ADMIN_COMPANIA",
  "DIRECTOR",
  "LIDER",
  "GESTOR",
  "CONSULTA",
] as const;

export type RolCodigo = (typeof ROLES)[number];

export type ItemNavegacion = {
  etiqueta: string;
  href: string;
  /**
   * Módulo declarado en CRM.docx como "No habilitado en esta versión"
   * (entidades_fase_2 del spec). Se muestra en el sidebar con la insignia V2,
   * deshabilitado, y `puedeAcceder` lo rechaza: la insignia es información, no
   * un control de seguridad.
   */
  fase2?: boolean;
  /**
   * Sub-ítems que se despliegan en acordeón bajo este ítem (p. ej.
   * "Comunicación" → Email / WhatsApp). Un ítem con `subitems` no tiene `href`
   * navegable propio: el acordeón solo expande o colapsa.
   */
  subitems?: ItemNavegacion[];
};

export type GrupoNavegacion = {
  titulo: string;
  items: ItemNavegacion[];
};

/** Etiqueta corta del badge de rol, como en el prototipo visual. */
export const ETIQUETA_ROL: Record<RolCodigo, string> = {
  ADMIN_GENERAL: "ADMIN. GENERAL",
  ADMIN_COMPANIA: "ADMIN. COMPAÑÍA",
  DIRECTOR: "DIRECTOR",
  LIDER: "LÍDER",
  GESTOR: "GESTOR",
  CONSULTA: "CONSULTA",
};

/**
 * "Consulta General", "Consulta Líder" y "Consulta Gestor" apuntan a la misma
 * ruta a propósito: el spec las modela como la misma vista con distinto
 * `filtro_sql` por rol, no como tres pantallas.
 */
export const NAVEGACION: Record<RolCodigo, GrupoNavegacion[]> = {
  ADMIN_GENERAL: [
    {
      titulo: "Administración",
      items: [
        { etiqueta: "Gestión de Compañías", href: `${BASE_CRM}/companias` },
      ],
    },
  ],

  ADMIN_COMPANIA: [
    {
      titulo: "Administración",
      items: [{ etiqueta: "Usuarios", href: `${BASE_CRM}/usuarios` }],
    },
  ],

  DIRECTOR: [
    {
      titulo: "General",
      items: [{ etiqueta: "Consulta General", href: `${BASE_CRM}/consulta` }],
    },
    {
      titulo: "Gestión comercial",
      items: [
        { etiqueta: "Metas", href: `${BASE_CRM}/metas` },
        {
          etiqueta: "Ajuste Pago Líder",
          href: `${BASE_CRM}/ajuste-pago-lider`,
          fase2: true,
        },
        {
          etiqueta: "Cargue Campañas",
          href: `${BASE_CRM}/cargue-campanas`,
          fase2: true,
        },
        {
          etiqueta: "Cargue Comunicación Masiva",
          href: `${BASE_CRM}/cargue-comunicacion-masiva`,
          fase2: true,
        },
      ],
    },
  ],

  LIDER: [
    {
      titulo: "General",
      items: [{ etiqueta: "Consulta Líder", href: `${BASE_CRM}/consulta` }],
    },
    {
      titulo: "Gestión comercial",
      items: [
        {
          etiqueta: "Ajuste Pago Gestor",
          href: `${BASE_CRM}/ajuste-pago-gestor`,
          fase2: true,
        },
      ],
    },
  ],

  GESTOR: [
    {
      titulo: "General",
      items: [{ etiqueta: "Consulta Gestor", href: `${BASE_CRM}/consulta` }],
    },
    {
      titulo: "Negociación",
      items: [{ etiqueta: "Prospección", href: `${BASE_CRM}/prospeccion` }],
    },
    {
      titulo: "Comunicación",
      items: [
        {
          etiqueta: "Comunicación",
          href: `${BASE_CRM}/comunicacion`,
          subitems: [
            { etiqueta: "Email", href: `${BASE_CRM}/comunicacion/email` },
            { etiqueta: "WhatsApp", href: `${BASE_CRM}/comunicacion/whatsapp` },
            { etiqueta: "Llamadas", href: `${BASE_CRM}/comunicacion/llamadas` },
          ],
        },
      ],
    },
  ],

  /**
   * PA-01 sigue abierta: CRM.docx §1 menciona el rol pero no le define flujo ni
   * menú, y la matriz de visibilidad lo deja en "Por definir". Sin ítems, el
   * usuario entra a una pantalla que lo explica en vez de a un sidebar vacío.
   */
  CONSULTA: [],
};

export function esRolConocido(codigo: string | null | undefined): codigo is RolCodigo {
  return !!codigo && (ROLES as readonly string[]).includes(codigo);
}

export function gruposDeRol(rol: RolCodigo): GrupoNavegacion[] {
  return NAVEGACION[rol];
}

/**
 * Un ítem y, si tiene, sus sub-ítems, aplanados. El padre de un acordeón
 * (p. ej. "Comunicación") no es una ruta navegable por sí mismo, solo el
 * contenedor que despliega sus sub-ítems: se excluye de la lista plana y solo
 * quedan los hijos, que sí tienen página propia.
 */
function conSubitems(item: ItemNavegacion): ItemNavegacion[] {
  return item.subitems ? item.subitems : [item];
}

/** Todos los ítems del rol, sin agrupar (incluye sub-ítems de acordeón). */
export function itemsDeRol(rol: RolCodigo): ItemNavegacion[] {
  return NAVEGACION[rol].flatMap((grupo) => grupo.items.flatMap(conSubitems));
}

/** Ítems a los que el rol puede entrar de verdad (excluye fase 2). */
export function itemsAccesibles(rol: RolCodigo): ItemNavegacion[] {
  return itemsDeRol(rol).filter((item) => !item.fase2);
}

/**
 * Primera ruta accesible del rol. Es el destino después del login y el que usa
 * /home para reenviar. `null` cuando el rol no tiene módulos (CONSULTA).
 */
export function rutaInicial(rol: RolCodigo): string | null {
  return itemsAccesibles(rol)[0]?.href ?? null;
}

function coincide(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Autorización de ruta. Un rol entra a una ruta si y solo si está en su menú y
 * no es de fase 2. Se evalúa en el proxy y otra vez en cada page: el spec exige
 * que el control exista en API y en BD, "la UI no es un control de seguridad".
 */
export function puedeAcceder(rol: RolCodigo, pathname: string): boolean {
  return itemsAccesibles(rol).some((item) => coincide(pathname, item.href));
}

/** El ítem del menú que corresponde a la ruta actual, para marcarlo activo. */
export function itemActivo(
  rol: RolCodigo,
  pathname: string,
): ItemNavegacion | null {
  return itemsDeRol(rol).find((item) => coincide(pathname, item.href)) ?? null;
}
