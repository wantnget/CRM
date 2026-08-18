import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/panel";
import { DataTable, type Columna } from "@/components/tabla/data-table";
import { EstadoPill } from "@/components/tabla/estado-pill";
import { AccionesFila } from "@/components/tabla/acciones-fila";
import { RolBadge } from "@/components/tabla/rol-badge";
import { CanalesCelda } from "@/components/tabla/canales-celda";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM, esRolConocido } from "@/lib/navegacion";
import { prisma } from "@/lib/prisma";

/**
 * Menú "Usuarios" del Administrador de Compañía (CRM.docx §4.2).
 *
 * No hay endpoint de por medio: es un server component que consulta Prisma
 * directo. Una API route obligaría a reimplementar la autorización ahí y a
 * mantener el filtro por compañía en dos lugares.
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
        <div className="px-8 py-8">
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

  const usuarios = await prisma.usuario.findMany({
    // Aislamiento multi-tenant. Mientras no exista la RLS que pide el spec,
    // este filtro es la única barrera: sin él una Admin de Compañía vería los
    // usuarios de todas las compañías.
    where: { companiaId: contexto.compania.id },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      email: true,
      numeroIdentificacion: true,
      estado: true,
      rol: { select: { codigo: true, nombre: true } },
      oficina: { select: { nombre: true } },
      usuarioCanales: {
        select: { canalCodigo: true, habilitado: true },
      },
    },
    // Los inactivos también se listan: no hay borrado físico (RN-06), así que
    // filtrarlos dejaría sin forma de reactivarlos.
    orderBy: [
      { rol: { orden: "asc" } },
      { apellidos: "asc" },
      { nombres: "asc" },
    ],
  });

  type Fila = (typeof usuarios)[number];

  const columnas: Columna<Fila>[] = [
    {
      id: "usuario",
      encabezado: "Usuario",
      celda: (u) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {u.nombres} {u.apellidos}
          </p>
          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    {
      id: "identificacion",
      encabezado: "Identificación",
      celda: (u) => u.numeroIdentificacion,
    },
    {
      id: "rol",
      encabezado: "Rol",
      celda: (u) =>
        esRolConocido(u.rol.codigo) ? (
          <RolBadge codigo={u.rol.codigo} nombre={u.rol.nombre} />
        ) : (
          u.rol.nombre
        ),
    },
    {
      id: "oficina",
      encabezado: "Oficina",
      celda: (u) =>
        u.oficina?.nombre ?? (
          <span className="text-muted-foreground">No aplica</span>
        ),
    },
    {
      id: "canales",
      encabezado: "Canales de comunicación",
      // Sin ancho minimo la tabla le asigna menos de lo que ocupan 3 pildoras
      // y los canales se parten en 3 lineas en vez de 2.
      ancho: "min-w-64",
      celda: (u) => <CanalesCelda canales={u.usuarioCanales} />,
    },
    {
      id: "estado",
      encabezado: "Estado",
      celda: (u) => <EstadoPill estado={u.estado} />,
    },
    {
      id: "acciones",
      encabezado: "Acción",
      alineacion: "derecha",
      // Sin handlers todavía: el alta y la edición son otra tarea, así que los
      // botones se ven como en el prototipo pero quedan deshabilitados.
      celda: (u) => <AccionesFila estado={u.estado} />,
    },
  ];

  return (
    <>
      <PageHeader contexto={contexto} titulo="Usuarios" />

      <div className="px-8 py-8">
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          Asigne el rol de plataforma a cada usuario. Para el rol Gestor habilite
          los canales de comunicación disponibles en su bandeja de prospección.
        </p>

        <Panel
          titulo="Usuarios de la compañía"
          meta={`${usuarios.length} usuario(s)`}
        >
          <DataTable
            columnas={columnas}
            filas={usuarios}
            claveFila={(u) => u.id}
            vacio="Esta compañía todavía no tiene usuarios registrados."
          />
        </Panel>
      </div>
    </>
  );
}
