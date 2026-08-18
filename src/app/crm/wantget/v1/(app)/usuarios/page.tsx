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


export default async function UsuariosPage() {

  const contexto = await exigirAcceso(`${BASE_CRM}/usuarios`);

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
