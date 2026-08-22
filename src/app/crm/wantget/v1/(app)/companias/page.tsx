import { PageHeader } from "@/components/layout/page-header";
import {
  CompaniasPanel,
  type FilaCompania,
} from "@/components/companias/companias-panel";
import { exigirAcceso } from "@/lib/autorizacion";
import { BASE_CRM } from "@/lib/navegacion";
import { prisma } from "@/lib/prisma";

/**
 * Menú "Gestión de Compañías" del Administrador General (CRM.docx §3.2).
 *
 * A diferencia de Usuarios, acá la consulta NO lleva filtro por compañía: el
 * alcance de este rol es global. RN-03 además pide que vea tanto las activas
 * como las inactivas, así que tampoco se filtra por estado.
 */
export default async function CompaniasPage() {
  // Segunda barrera de autorización, además del proxy.
  const contexto = await exigirAcceso(`${BASE_CRM}/companias`);

  const companias = await prisma.compania.findMany({
    select: {
      id: true,
      nit: true,
      digitoVerificacion: true,
      razonSocial: true,
      estado: true,
      horaCierreSesion: true,
      usuarios: {
        where: { rolCodigo: "ADMIN_COMPANIA" },
        select: {
          id: true,
          email: true,
          nombres: true,
          apellidos: true,
          estado: true,
        },
        orderBy: [{ estado: "asc" }, { apellidos: "asc" }],
      },
      oficinas: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
          estado: true,
          // Usuarios activos asignados: bloquean la inactivación de la oficina.
          _count: {
            select: {
              usuarios: { where: { estado: "ACTIVO" } },
              usuarioOficinas: { where: { usuario: { estado: "ACTIVO" } } },
            },
          },
        },
        orderBy: { nombre: "asc" },
      },
    },
    orderBy: { razonSocial: "asc" },
  });

  const filas: FilaCompania[] = companias.map((c) => ({
    id: c.id,
    nit: c.nit,
    digitoVerificacion: c.digitoVerificacion,
    razonSocial: c.razonSocial,
    estado: c.estado,
    horaCierreSesion: c.horaCierreSesion,
    administradores: c.usuarios.map((u) => ({
      id: u.id,
      email: u.email,
      nombreCompleto: `${u.nombres} ${u.apellidos}`,
      estado: u.estado,
    })),
    oficinas: c.oficinas.map((o) => ({
      id: o.id,
      codigo: o.codigo,
      nombre: o.nombre,
      estado: o.estado,
      usuariosActivos: o._count.usuarios + o._count.usuarioOficinas,
    })),
  }));

  return (
    <>
      <PageHeader contexto={contexto} titulo="Gestión de Compañías" />

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <CompaniasPanel companias={filas} />
      </div>
    </>
  );
}
