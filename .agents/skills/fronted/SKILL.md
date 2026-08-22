---
name: nextjs-shadcn
description: Referencia de frontend con Next.js (App Router) + TypeScript + Tailwind + shadcn/ui. Cubre creación de proyecto, CLI de shadcn, estructura de carpetas, Server/Client Components, formularios con react-hook-form + zod, data fetching, Server Actions, tablas con TanStack Table y theming. Úsala siempre que el usuario mencione Next.js, App Router, shadcn, shadcn/ui, Tailwind, componentes de UI, formularios web, dashboards, layouts, rutas, o pida crear/modificar cualquier pantalla o componente de un frontend web, aunque no nombre explícitamente shadcn.
license: MIT
metadata:
  author: wantnget
  version: "1.0.0"
---

# Next.js + shadcn/ui Frontend Reference

Referencia para construir frontends con Next.js App Router, TypeScript, Tailwind CSS y shadcn/ui. Aplica a proyectos nuevos y a la extensión de proyectos existentes.

## Límite de alcance

Esta skill cubre **shadcn/ui** (componentes copiados al repo vía CLI, sobre Radix + Tailwind). No confundir con librerías de componentes empaquetadas (MUI, Chakra, Ant Design): en shadcn/ui el código vive en `components/ui/` y **se edita directamente**, no se sobrescribe con props de tema.

Tampoco cubre Pages Router (`pages/`). Si el proyecto usa `pages/`, indicarlo y no mezclar patrones de App Router.

## Cuándo aplicarla

- Crear un proyecto Next.js desde cero (`create-next-app`)
- Agregar o actualizar componentes (`shadcn add`)
- Decidir entre Server Component y Client Component
- Construir formularios validados (react-hook-form + zod)
- Data fetching, caché, revalidación y Server Actions
- Tablas, filtros y paginación
- Theming, dark mode y tokens de color

## Prioridad de reglas

| Prioridad | Categoría | Impacto | Prefijo |
|-----------|-----------|---------|---------|
| 1 | Server vs Client Components | CRÍTICO | `rsc` |
| 2 | Data fetching y mutaciones | ALTO | `data-` |
| 3 | Formularios y validación | ALTO | `forms` |
| 4 | Estructura y rutas | ALTO | `routing` |
| 5 | Componentes shadcn | MEDIO | `ui-` |
| 6 | Theming y estilos | MEDIO | `theme` |

## Referencia rápida

### Crear proyecto

```bash
# Proyecto nuevo (App Router + TS + Tailwind)
npx create-next-app@latest mi-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd mi-app

# Inicializar shadcn/ui (crea components.json y lib/utils.ts)
npx shadcn@latest init
```

`shadcn init` pregunta base color y si usa CSS variables. **Responder sí a CSS variables**: es lo que habilita theming y dark mode sin reescribir componentes.

### CLI de shadcn/ui

```bash
# Agregar componentes
npx shadcn@latest add button input form table dialog

# Ver componentes disponibles
npx shadcn@latest add

# Sobrescribir un componente ya instalado
npx shadcn@latest add button --overwrite

# Instalar desde un registry/URL
npx shadcn@latest add https://ejemplo.com/r/mi-componente.json
```

Los componentes se copian a `src/components/ui/`. Son código propio del repo: modificarlos es esperado. Antes de `--overwrite`, revisar si el componente tiene cambios locales.

### Estructura de proyecto

```
src/
├── app/
│   ├── layout.tsx              # Root layout (html/body, fuentes, providers)
│   ├── page.tsx
│   ├── globals.css             # Tailwind + tokens de tema
│   ├── (auth)/                 # Route group: no afecta la URL
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   └── (dashboard)/
│       ├── layout.tsx          # Sidebar + header compartidos
│       ├── clientes/
│       │   ├── page.tsx
│       │   ├── loading.tsx
│       │   ├── error.tsx
│       │   └── [id]/page.tsx
│       └── api/                # Route handlers (solo si hay consumidores externos)
├── components/
│   ├── ui/                     # shadcn (generado por CLI)
│   └── <feature>/              # Componentes propios agrupados por dominio
├── lib/
│   ├── utils.ts                # cn()
│   ├── db.ts                   # cliente Prisma / conexión
│   └── validations/            # schemas zod compartidos
├── hooks/
└── types/
```

Agrupar por dominio (`components/clientes/`, `components/creditos/`) en vez de por tipo (`components/cards/`, `components/forms/`): al crecer, el dominio es lo que se busca.

### Archivos especiales de ruta

| Archivo | Función |
|---------|---------|
| `page.tsx` | UI de la ruta (la hace pública) |
| `layout.tsx` | Envoltura persistente, no se re-monta al navegar |
| `loading.tsx` | Fallback de Suspense automático |
| `error.tsx` | Error boundary; **siempre** `'use client'` |
| `not-found.tsx` | 404 de la ruta |
| `route.ts` | Endpoint HTTP (GET/POST...) |
| `middleware.ts` | En la raíz; auth y redirects antes de renderizar |

## Regla central: Server vs Client Components

Todo componente en `app/` es **Server Component** por defecto. `'use client'` solo cuando el componente necesita interactividad del navegador.

Poner `'use client'`:
- `useState`, `useEffect`, `useReducer`, `useContext`
- Handlers de eventos (`onClick`, `onChange`, `onSubmit`)
- APIs del browser (`window`, `localStorage`, `IntersectionObserver`)
- Librerías que internamente usan lo anterior (react-hook-form, recharts, TanStack Table)

Mantener Server Component:
- Fetch de datos, acceso a base de datos, secretos y llaves
- Contenido estático o de solo lectura
- Composición de layouts

**Empujar `'use client'` hacia las hojas del árbol.** Marcar un layout completo como cliente arrastra todo su subárbol al bundle. Patrón correcto: el page server obtiene los datos y los pasa a un componente cliente pequeño.

```tsx
// app/(dashboard)/clientes/page.tsx  — Server Component
import { db } from '@/lib/db'
import { ClientesTable } from '@/components/clientes/clientes-table'

export default async function ClientesPage() {
  const clientes = await db.cliente.findMany({ orderBy: { createdAt: 'desc' } })
  return <ClientesTable data={clientes} />
}
```

```tsx
// components/clientes/clientes-table.tsx — Client Component
'use client'
import { useState } from 'react'

export function ClientesTable({ data }: { data: Cliente[] }) {
  const [filtro, setFiltro] = useState('')
  // ...
}
```

Un Server Component puede pasarse como `children` o prop a un Client Component sin volverse cliente. Esto permite mantener contenido pesado en el servidor dentro de shells interactivos (modales, tabs, sidebars).

## Reglas por categoría

Abrir el archivo de referencia correspondiente cuando la tarea entre en su ámbito:

```
references/rsc.md            - Server/Client Components, streaming, Suspense
references/routing.md        - Rutas dinámicas, groups, layouts, metadata
references/data-fetching.md  - fetch, caché, revalidación, params async
references/data-mutations.md - Server Actions, useActionState, revalidatePath
references/forms.md          - react-hook-form + zod + <Form> de shadcn
references/ui-components.md  - Componentes shadcn frecuentes y su uso
references/ui-tables.md      - TanStack Table + DataTable de shadcn
references/theme.md          - Tokens, dark mode, cn(), variantes con CVA
references/auth-patterns.md  - Middleware, sesión en servidor, rutas protegidas
references/gotchas.md        - Errores comunes y sus causas
```

## Convenciones de código

- **Alias `@/`** para imports internos; nada de `../../../`.
- **`cn()` siempre** para clases condicionales: `cn('rounded-md', isActive && 'bg-accent', className)`. Concatenar strings a mano rompe la resolución de conflictos de Tailwind.
- **Aceptar `className`** como prop en componentes propios reutilizables.
- **Tipar props con `interface`** exportada cuando el componente se usa fuera de su módulo.
- **Sin `any`.** Derivar tipos del schema (`z.infer<typeof schema>`) o del ORM.
- **No usar `<form>` HTML nativo con handlers ad-hoc** cuando exista Server Action o react-hook-form; elegir uno de los dos patrones y mantenerlo.

## Diffs mínimos en proyectos existentes

Antes de crear archivos en un repo ya iniciado:

1. Leer `components.json` (confirma alias, estilo, si usa CSS variables y ruta de `ui/`).
2. Revisar `package.json` (versión de Next, de Tailwind v3 vs v4, ORM, librería de forms).
3. Revisar un componente existente del mismo tipo y **copiar su estilo**, no imponer otro.

Tailwind v4 configura el tema en `globals.css` con `@theme`, no en `tailwind.config.ts`. Verificar cuál aplica antes de tocar tokens.

## Cómo usar esta skill

Ubicar la tarea en la tabla de prioridades, aplicar la regla central de Server/Client, y abrir el archivo de `references/` específico antes de escribir código.
