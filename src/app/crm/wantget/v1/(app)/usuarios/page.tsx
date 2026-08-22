import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/panel";
import {
  UsuariosPanel,
  type FilaUsuario,
} from "@/components/usuarios/usuarios-panel";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM } from "@/lib/navegacion";
import { prisma } from "@/lib/prisma";

/**
 * Menú "Usuarios" del Administrador de Compañía (CRM.docx §4.2).
 *
 * No hay endpoint de por medio: es un server component que consulta Prisma
 * directo y las mutaciones son server actions (./acciones.ts). Una API route
 * obligaría a reimplementar la autorización ahí y a mantener el filtro por
 * compañía en más lugares.
 */
export default async function UsuariosPage() {
  // Segunda barrera de autorización, además del proxy: el spec exige que el
  // control de alcance por rol no viva solo en la UI.
  const contexto = await exigirAcceso(`${BASE_CRM}/usuarios`);

  // El CHECK ck_usuario_admin_general_sin_compania garantiza que todo rol
  // distinto de ADMIN_GENERAL tenga compañía, y esta ruta solo la alcanza
  // ADMIN_COMPANIA. Se valida igual para no depender de un aserto de tipos.
  if (!contexto.compania) {
    return (
      <>
        <PageHeader contexto={contexto} titulo="Usuarios" />
        <div className="px-4 py-6 sm:px-8 sm:py-8">
          <Panel titulo="Usuarios de la compañía">
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              Este rol no está asociado a una compañía, así que no tiene usuarios
              que administrar.
            </p>
          </Panel>
        </div>
      </>
    );
  }

  const companiaId = contexto.compania.id;

  const [usuarios, oficinas, lideres, catalogoCanales] = await Promise.all([
    prisma.usuario.findMany({
      // Aislamiento multi-tenant. Mientras no exista la RLS que pide el spec,
      // este filtro es la única barrera: sin él una Admin de Compañía vería los
      // usuarios de todas las compañías.
      where: { companiaId },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        numeroIdentificacion: true,
        telefonoWhatsapp: true,
        estado: true,
        rol: { select: { codigo: true, nombre: true } },
        oficina: { select: { id: true, nombre: true } },
        usuarioCanales: { select: { canalCodigo: true, habilitado: true } },
        usuarioOficinas: { select: { oficinaId: true } },
        // Líder vigente del Gestor: la fila abierta de asignacion_gestor_lider
        // (RN-19, un único líder vigente por fecha).
        comoGestorAsignaciones: {
          where: { vigenteHasta: null },
          select: { liderId: true },
          orderBy: { vigenteDesde: "desc" },
          take: 1,
        },
      },
      // Los inactivos también se listan: no hay borrado físico (RN-06), así que
      // filtrarlos dejaría sin forma de reactivarlos.
      orderBy: [
        { rol: { orden: "asc" } },
        { apellidos: "asc" },
        { nombres: "asc" },
      ],
    }),
    prisma.oficina.findMany({
      where: { companiaId, estado: "ACTIVO" },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    // Candidatos a líder de un Gestor: solo LIDER activos de la compañía
    // (RN-20).
    prisma.usuario.findMany({
      where: { companiaId, rolCodigo: "LIDER", estado: "ACTIVO" },
      select: { id: true, nombres: true, apellidos: true },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    }),

    // El catálogo de canales manda: la lista ya no vive duplicada en el cliente.
    prisma.canalComunicacion.findMany({
      select: { codigo: true, nombre: true },
      orderBy: { orden: "asc" },
    }),
  ]);

  const filas: FilaUsuario[] = usuarios.map((u) => ({
    id: u.id,
    nombres: u.nombres,
    apellidos: u.apellidos,
    email: u.email,
    numeroIdentificacion: u.numeroIdentificacion,
    telefonoWhatsapp: u.telefonoWhatsapp,
    estado: u.estado,
    rolCodigo: u.rol.codigo,
    rolNombre: u.rol.nombre,
    oficinaId: u.oficina?.id ?? null,
    oficinaNombre: u.oficina?.nombre ?? null,
    oficinasIds: u.usuarioOficinas.map((uo) => uo.oficinaId),
    liderId: u.comoGestorAsignaciones[0]?.liderId ?? null,
    // Se parte del catálogo y no de las filas del usuario: un Gestor dado de
    // alta antes de que existiera un canal no tiene su fila, y sin esto ese
    // canal desaparecería de su columna en vez de mostrarse inhabilitado.
    canales: catalogoCanales.map((canal) => ({
      canalCodigo: canal.codigo,
      nombre: canal.nombre,
      habilitado:
        u.usuarioCanales.find((uc) => uc.canalCodigo === canal.codigo)
          ?.habilitado ?? false,
    })),
    // Solo los Gestores tienen canales (RN-15); en los demás roles la columna
    // muestra "No aplica", que el componente decide con esta bandera.
    aplicanCanales: u.rol.codigo === "GESTOR",
  }));

  return (
    <>
      <PageHeader contexto={contexto} titulo="Usuarios" />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <UsuariosPanel
          usuarios={filas}
          oficinas={oficinas}
          lideres={lideres.map((l) => ({
            id: l.id,
            nombre: `${l.nombres} ${l.apellidos}`,
          }))}
        />
      </div>
    </>
  );
}
