import "dotenv/config";
import { prisma } from "@/lib/prisma";
import {
  DOMINIO,
  METAS,
  VENTAS,
  type VentaReferencia,
} from "./datos-comerciales";

/**
 * Semilla derivada de public/docs/estructura_bd_crm.json:
 * los 3 catálogos (`catalogos`) y el ambiente de desarrollo (`datos_semilla`).
 *
 * Es idempotente: se puede correr varias veces sin duplicar.
 *
 * TELÉFONOS: el spec registra en INC-01 que las fuentes no traen el teléfono de
 * WhatsApp de los usuarios, pero `telefono_whatsapp` es obligatorio porque sin
 * él el OTP no es implementable. Los valores de abajo son PLACEHOLDERS en
 * formato E.164 y no reciben mensajes.
 *
 * Para probar el login, define en .env (no se versiona):
 *
 *   SEED_OTP_PHONE                   tu número se aplica a los 10 usuarios, así
 *                                    se alterna de rol cerrando sesión y
 *                                    entrando con otro correo
 *   SEED_OTP_PHONE + SEED_OTP_EMAIL  solo ese usuario queda con tu número
 */

const ROLES = [
  { codigo: "ADMIN_GENERAL", nombre: "Administrador General", ambito: "GLOBAL", orden: 1, descripcion: "Único rol fuera del alcance de una compañía. Crea compañías y los Administradores de Compañía." },
  { codigo: "ADMIN_COMPANIA", nombre: "Administrador de Compañía", ambito: "COMPANIA", orden: 2, descripcion: "Crea y edita usuarios de la compañía y habilita canales al rol Gestor." },
  { codigo: "DIRECTOR", nombre: "Director", ambito: "COMPANIA", orden: 3, descripcion: "Consulta general de toda la compañía y cargue de metas." },
  { codigo: "LIDER", nombre: "Líder", ambito: "OFICINA", orden: 4, descripcion: "Consulta de sus oficinas y de los gestores a su cargo. Asigna asociados a sus gestores." },
  { codigo: "GESTOR", nombre: "Gestor", ambito: "PROPIO", orden: 5, descripcion: "Consulta su propia gestión y ejecuta la prospección comercial." },
  { codigo: "CONSULTA", nombre: "Consulta", ambito: "PENDIENTE_DEFINIR", orden: 6, descripcion: "Mencionado en CRM.docx §1 pero sin flujo ni menú definido. Ver pregunta abierta PA-01." },
] as const;

const PRODUCTOS = [
  { codigo: "AFILIACION", nombre: "Afiliación", unidadMedida: "UNIDADES", orden: 1 },
  { codigo: "COLOCACION", nombre: "Colocación", unidadMedida: "MONTO", orden: 2 },
  { codigo: "CUENTA_AHORRO", nombre: "Cuentas de ahorro", unidadMedida: "UNIDADES", orden: 3 },
  { codigo: "AHORRO_PROGRAMADO", nombre: "Ahorro programado", unidadMedida: "UNIDADES", orden: 4 },
  { codigo: "CDAT", nombre: "CDAT", unidadMedida: "MONTO", orden: 5 },
  { codigo: "SEGUROS", nombre: "Seguros", unidadMedida: "UNIDADES", orden: 6 },
  { codigo: "SERVICIOS", nombre: "Servicios", unidadMedida: "UNIDADES", orden: 7 },
] as const;

const CANALES = [
  { codigo: "WA_SALIDA", nombre: "WhatsApp salida", medio: "WHATSAPP", direccion: "SALIDA", orden: 1 },
  { codigo: "WA_ENTRADA", nombre: "WhatsApp entrada", medio: "WHATSAPP", direccion: "ENTRADA", orden: 2 },
  { codigo: "CORREO_SALIDA", nombre: "Correo salida", medio: "EMAIL", direccion: "SALIDA", orden: 3 },
  { codigo: "CORREO_ENTRADA", nombre: "Correo entrada", medio: "EMAIL", direccion: "ENTRADA", orden: 4 },
] as const;

const COMPANIA = { nit: "900100200", razonSocial: "Fondo Want" };

const OFICINAS = [
  { codigo: "NORTE", nombre: "Norte" },
  { codigo: "SUR", nombre: "Sur" },
] as const;

type SeedCanales = Partial<Record<(typeof CANALES)[number]["codigo"], boolean>>;

type SeedUsuario = {
  email: string;
  nombres: string;
  apellidos: string;
  numeroIdentificacion: string;
  rolCodigo: string;
  oficina: "NORTE" | "SUR" | null;
  telefono: string;
  canales?: SeedCanales;
};

/**
 * RN-09: ningún rol puede crear un ADMIN_GENERAL desde la aplicación; el alta
 * es "por provisión inicial". Este es ese registro. No viene del spec: hace
 * falta porque `compania.created_by` es NOT NULL y alguien tiene que ser el
 * creador de Fondo Want.
 */
const ADMIN_GENERAL: SeedUsuario = {
  email: "admin.general@wantnget.com.co",
  nombres: "Administrador",
  apellidos: "General",
  numeroIdentificacion: "00000001",
  rolCodigo: "ADMIN_GENERAL",
  oficina: null,
  telefono: "+570000000001",
};

const USUARIOS: SeedUsuario[] = [
  { email: "dorjuela@wantnget.com.co", nombres: "Daniel", apellidos: "Orjuela", numeroIdentificacion: "00000002", rolCodigo: "ADMIN_COMPANIA", oficina: null, telefono: "+570000000002" },
  { email: "amunoz@wantnget.com.co", nombres: "Andrés", apellidos: "Muñoz", numeroIdentificacion: "00000003", rolCodigo: "ADMIN_COMPANIA", oficina: null, telefono: "+570000000003" },
  { email: "pperez@wantnget.com.co", nombres: "Pedro", apellidos: "Perez", numeroIdentificacion: "10125142", rolCodigo: "DIRECTOR", oficina: null, telefono: "+570000000004" },
  { email: "mmartinez@wantnget.com.co", nombres: "Maria", apellidos: "Martínez", numeroIdentificacion: "10304052", rolCodigo: "LIDER", oficina: "NORTE", telefono: "+570000000005" },
  { email: "ccaceres@wantnget.com.co", nombres: "Carolina", apellidos: "Cacerez", numeroIdentificacion: "10748769", rolCodigo: "LIDER", oficina: "SUR", telefono: "+570000000006" },
  { email: "prubio@wantnget.com.co", nombres: "Paula", apellidos: "Rubio", numeroIdentificacion: "31475749", rolCodigo: "GESTOR", oficina: "SUR", telefono: "+570000000007", canales: { WA_SALIDA: true, WA_ENTRADA: true, CORREO_SALIDA: false, CORREO_ENTRADA: true } },
  { email: "sramirez@wantnget.com.co", nombres: "Silvana", apellidos: "Ramírez", numeroIdentificacion: "7415749", rolCodigo: "GESTOR", oficina: "SUR", telefono: "+570000000008", canales: { WA_SALIDA: true, WA_ENTRADA: true, CORREO_SALIDA: true, CORREO_ENTRADA: true } },
  { email: "pjimenez@wantnget.com.co", nombres: "Pablo", apellidos: "Jimenez", numeroIdentificacion: "41748574", rolCodigo: "GESTOR", oficina: "NORTE", telefono: "+570000000009", canales: { WA_SALIDA: false, WA_ENTRADA: true, CORREO_SALIDA: true, CORREO_ENTRADA: true } },
  { email: "dgonzalez@wantnget.com.co", nombres: "Diana", apellidos: "Gonzalez", numeroIdentificacion: "21457963", rolCodigo: "GESTOR", oficina: "NORTE", telefono: "+570000000010", canales: { WA_SALIDA: false, WA_ENTRADA: true, CORREO_SALIDA: true, CORREO_ENTRADA: true } },
];

/** Derivado de `datos_semilla.asignacion_gestor_lider` (hojas Ventas y Metas). */
const ASIGNACIONES_GESTOR_LIDER = [
  { gestor: "dgonzalez@wantnget.com.co", lider: "mmartinez@wantnget.com.co" },
  { gestor: "pjimenez@wantnget.com.co", lider: "mmartinez@wantnget.com.co" },
  { gestor: "prubio@wantnget.com.co", lider: "ccaceres@wantnget.com.co" },
  { gestor: "sramirez@wantnget.com.co", lider: "ccaceres@wantnget.com.co" },
];

/** RN-14: en los datos de referencia cada Líder tiene una sola oficina. */
const OFICINAS_POR_LIDER = [
  { lider: "mmartinez@wantnget.com.co", oficinas: ["NORTE"] },
  { lider: "ccaceres@wantnget.com.co", oficinas: ["SUR"] },
];

function telefonoDe(usuario: SeedUsuario) {
  const overridePhone = process.env.SEED_OTP_PHONE;
  if (!overridePhone) return usuario.telefono;

  const overrideEmail = process.env.SEED_OTP_EMAIL?.toLowerCase();

  // Sin SEED_OTP_EMAIL el número va a todos los usuarios del seed: es lo que
  // permite alternar de rol solo cerrando sesión y entrando con otro correo,
  // sin editar .env ni volver a sembrar.
  if (!overrideEmail) return overridePhone;

  return usuario.email === overrideEmail ? overridePhone : usuario.telefono;
}

async function seedCatalogos() {
  for (const rol of ROLES) {
    await prisma.rol.upsert({
      where: { codigo: rol.codigo },
      update: { nombre: rol.nombre, ambito: rol.ambito, orden: rol.orden, descripcion: rol.descripcion },
      create: { ...rol },
    });
  }

  for (const producto of PRODUCTOS) {
    await prisma.producto.upsert({
      where: { codigo: producto.codigo },
      update: { nombre: producto.nombre, unidadMedida: producto.unidadMedida, orden: producto.orden },
      create: { ...producto },
    });
  }

  for (const canal of CANALES) {
    await prisma.canalComunicacion.upsert({
      where: { codigo: canal.codigo },
      update: { nombre: canal.nombre, medio: canal.medio, direccion: canal.direccion, orden: canal.orden },
      create: { ...canal },
    });
  }

  console.log(
    `Catálogos: ${ROLES.length} roles, ${PRODUCTOS.length} productos, ${CANALES.length} canales`,
  );
}

/**
 * Datos comerciales de referencia: asociados, oportunidades y metas del Excel
 * "Base de Datos Ventas y Pagos" (hoja Ventas y hoja Metas).
 *
 * Son los que alimentan el dashboard de Resultados Comerciales. Se borran y
 * recrean en cada corrida para que un cambio en datos-comerciales.ts se refleje;
 * el veto al DELETE del spec (RN-01, RN-33) aplica a la aplicación, no a la
 * siembra del ambiente de desarrollo.
 */
async function seedComercial(
  companiaId: string,
  adminGeneralId: string,
  usuarios: Map<string, string>,
  oficinas: Map<string, string>,
) {
  const idDe = (prefijo: string) => {
    const id = usuarios.get(`${prefijo}${DOMINIO}`);
    if (!id) throw new Error(`no encontre al usuario ${prefijo}${DOMINIO}`);
    return id;
  };

  // Unidad de medida por producto: decide si el valor va a cantidad o a monto.
  const productos = await prisma.producto.findMany({
    select: { codigo: true, unidadMedida: true },
  });
  const unidad = new Map(productos.map((p) => [p.codigo, p.unidadMedida]));

  // 1. Asociados. El Excel no trae teléfono ni correo (INC-02 del spec), así
  //    que quedan nulos: ambas columnas son opcionales.
  const asociados = new Map<string, string>();
  for (const venta of VENTAS) {
    if (asociados.has(venta.numeroIdentificacion)) continue;
    const registro = await prisma.asociado.upsert({
      where: {
        companiaId_numeroIdentificacion: {
          companiaId,
          numeroIdentificacion: venta.numeroIdentificacion,
        },
      },
      update: { nombreCompleto: venta.nombreAsociado },
      create: {
        companiaId,
        numeroIdentificacion: venta.numeroIdentificacion,
        nombreCompleto: venta.nombreAsociado,
        oficinaId: oficinas.get(venta.oficinaCodigo)!,
        origen: "CARGUE",
        createdBy: adminGeneralId,
      },
    });
    asociados.set(venta.numeroIdentificacion, registro.id);
  }

  // 2. Oportunidades: una fila de la hoja Ventas es una oportunidad.
  await prisma.oportunidad.deleteMany({ where: { companiaId } });

  const valorDe = (venta: VentaReferencia) => {
    if (venta.valor === null) return { cantidad: null, monto: null };
    return unidad.get(venta.productoCodigo) === "MONTO"
      ? { cantidad: null, monto: venta.valor }
      : { cantidad: venta.valor, monto: null };
  };

  for (const venta of VENTAS) {
    const fecha = new Date(`${venta.fecha}T12:00:00Z`);
    const cerrada = venta.etapa === "CIERRE";

    await prisma.oportunidad.create({
      data: {
        companiaId,
        asociadoId: asociados.get(venta.numeroIdentificacion)!,
        productoCodigo: venta.productoCodigo,
        gestorId: idDe(venta.gestor),
        // Denormalizados a propósito: congelan la atribución histórica.
        liderId: idDe(venta.lider),
        oficinaId: oficinas.get(venta.oficinaCodigo)!,
        estado: venta.estado,
        etapa: venta.etapa,
        resultadoCierre: venta.resultadoCierre,
        ...valorDe(venta),
        fechaApertura: fecha,
        fechaUltimaGestion: fecha,
        fechaCierre: cerrada ? fecha : null,
        periodo: venta.fecha.slice(0, 7),
        createdBy: adminGeneralId,
      },
    });
  }

  // 3. Metas. El líder que trae la hoja se ignora (INC-07): las 28 filas dicen
  //    lo mismo y contradice a la hoja Ventas. Se resuelve desde la asignación
  //    vigente, que es lo que indica el spec.
  for (const meta of METAS) {
    const gestorId = idDe(meta.gestor);
    const asignacion = await prisma.asignacionGestorLider.findFirst({
      where: { gestorId, vigenteHasta: null },
      select: { liderId: true },
    });

    const esMonto = unidad.get(meta.productoCodigo) === "MONTO";

    await prisma.meta.upsert({
      where: {
        companiaId_periodo_usuarioId_productoCodigo: {
          companiaId,
          periodo: meta.periodo,
          usuarioId: gestorId,
          productoCodigo: meta.productoCodigo,
        },
      },
      update: {
        metaCantidad: esMonto ? null : meta.meta,
        metaMonto: esMonto ? meta.meta : null,
        liderId: asignacion?.liderId ?? null,
      },
      create: {
        companiaId,
        periodo: meta.periodo,
        rolObjetivo: "GESTOR",
        usuarioId: gestorId,
        liderId: asignacion?.liderId ?? null,
        productoCodigo: meta.productoCodigo,
        metaCantidad: esMonto ? null : meta.meta,
        metaMonto: esMonto ? meta.meta : null,
        createdBy: adminGeneralId,
      },
    });
  }

  // 4. Asignaciones de asociados a gestores.
  //
  // RN-32 exige que el Gestor solo prospecte asociados que le haya asignado su
  // Líder, pero el Excel no trae esa asignación: es la brecha INC-03 del spec,
  // que señala que CRM.docx no describe la pantalla donde el Líder asigna.
  //
  // Se derivan de las oportunidades ya cargadas —cada una dice qué asociado
  // trabajó qué gestor— y el líder que asigna sale de la asignación vigente.
  // Es dato de desarrollo: no reemplaza a la pantalla del Líder.
  await prisma.asignacionAsociado.deleteMany({ where: { companiaId } });

  const asignadas = new Set<string>();
  for (const venta of VENTAS) {
    const asociadoId = asociados.get(venta.numeroIdentificacion)!;
    const gestorId = idDe(venta.gestor);
    const clave = `${asociadoId}|${gestorId}`;
    if (asignadas.has(clave)) continue;
    asignadas.add(clave);

    await prisma.asignacionAsociado.create({
      data: {
        companiaId,
        asociadoId,
        gestorId,
        // RN-34: quien asigna es el Líder del gestor.
        asignadoPorId: idDe(venta.lider),
        fechaAsignacion: new Date(`${venta.fecha}T12:00:00Z`),
        observacion: "Derivada de los datos de referencia (INC-03)",
      },
    });
  }

  console.log(
    `Comercial: ${asociados.size} asociados, ${VENTAS.length} oportunidades, ${METAS.length} metas, ${asignadas.size} asignaciones de asociado`,
  );
}

async function main() {
  await seedCatalogos();

  // 1. ADMIN_GENERAL primero: no tiene compañía y es el creador de todo.
  const adminGeneral = await prisma.usuario.upsert({
    where: { email: ADMIN_GENERAL.email },
    // El telefono tambien se refresca en las re-corridas, igual que el de los
    // demas usuarios: si no, este quedaba con el placeholder para siempre.
    update: { telefonoWhatsapp: telefonoDe(ADMIN_GENERAL) },
    create: {
      email: ADMIN_GENERAL.email,
      nombres: ADMIN_GENERAL.nombres,
      apellidos: ADMIN_GENERAL.apellidos,
      numeroIdentificacion: ADMIN_GENERAL.numeroIdentificacion,
      telefonoWhatsapp: telefonoDe(ADMIN_GENERAL),
      rolCodigo: ADMIN_GENERAL.rolCodigo,
      emailVerified: true,
    },
  });

  // 2. La compañía, ya con un created_by válido.
  const compania = await prisma.compania.upsert({
    where: { nit: COMPANIA.nit },
    update: {},
    create: {
      nit: COMPANIA.nit,
      razonSocial: COMPANIA.razonSocial,
      createdBy: adminGeneral.id,
    },
  });

  // 3. Oficinas.
  const oficinas = new Map<string, string>();
  for (const oficina of OFICINAS) {
    const registro = await prisma.oficina.upsert({
      where: { companiaId_codigo: { companiaId: compania.id, codigo: oficina.codigo } },
      update: { nombre: oficina.nombre },
      create: {
        companiaId: compania.id,
        codigo: oficina.codigo,
        nombre: oficina.nombre,
        createdBy: adminGeneral.id,
      },
    });
    oficinas.set(oficina.codigo, registro.id);
  }

  // 4. Usuarios de la compañía.
  const usuarios = new Map<string, string>([[adminGeneral.email, adminGeneral.id]]);
  for (const usuario of USUARIOS) {
    const registro = await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: { telefonoWhatsapp: telefonoDe(usuario) },
      create: {
        companiaId: compania.id,
        email: usuario.email,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        numeroIdentificacion: usuario.numeroIdentificacion,
        telefonoWhatsapp: telefonoDe(usuario),
        rolCodigo: usuario.rolCodigo,
        oficinaId: usuario.oficina ? oficinas.get(usuario.oficina) : null,
        emailVerified: true,
        createdBy: adminGeneral.id,
      },
    });
    usuarios.set(usuario.email, registro.id);

    // RN-16: al crear un Gestor se generan los 4 canales. El spec trae el
    // estado real de cada uno en datos_semilla.
    if (usuario.rolCodigo === "GESTOR") {
      for (const canal of CANALES) {
        await prisma.usuarioCanal.upsert({
          where: { usuarioId_canalCodigo: { usuarioId: registro.id, canalCodigo: canal.codigo } },
          update: { habilitado: usuario.canales?.[canal.codigo] ?? false },
          create: {
            companiaId: compania.id,
            usuarioId: registro.id,
            canalCodigo: canal.codigo,
            habilitado: usuario.canales?.[canal.codigo] ?? false,
          },
        });
      }
    }
  }

  // 5. Oficinas del Líder (N:M, solo rol LIDER).
  for (const { lider, oficinas: codigos } of OFICINAS_POR_LIDER) {
    const usuarioId = usuarios.get(lider)!;
    for (const codigo of codigos) {
      await prisma.usuarioOficina.upsert({
        where: { usuarioId_oficinaId: { usuarioId, oficinaId: oficinas.get(codigo)! } },
        update: { vigente: true },
        create: {
          companiaId: compania.id,
          usuarioId,
          oficinaId: oficinas.get(codigo)!,
          createdBy: adminGeneral.id,
        },
      });
    }
  }

  // 6. Asignaciones gestor -> líder, con vigencia abierta.
  for (const { gestor, lider } of ASIGNACIONES_GESTOR_LIDER) {
    const gestorId = usuarios.get(gestor)!;
    const liderId = usuarios.get(lider)!;

    const existente = await prisma.asignacionGestorLider.findFirst({
      where: { gestorId, liderId, vigenteHasta: null },
    });
    if (existente) continue;

    await prisma.asignacionGestorLider.create({
      data: {
        companiaId: compania.id,
        gestorId,
        liderId,
        vigenteDesde: new Date("2026-08-01"),
        createdBy: adminGeneral.id,
      },
    });
  }

  console.log(
    `Compañía ${compania.razonSocial}: ${oficinas.size} oficinas, ${usuarios.size} usuarios, ${ASIGNACIONES_GESTOR_LIDER.length} asignaciones`,
  );

  // 7. Datos comerciales de referencia. Va al final porque depende de los
  //    usuarios y las oficinas, y las metas necesitan las asignaciones.
  await seedComercial(compania.id, adminGeneral.id, usuarios, oficinas);

  const telefonoPruebas = process.env.SEED_OTP_PHONE;
  const soloUno = process.env.SEED_OTP_EMAIL;

  if (!telefonoPruebas) {
    console.log(
      "\nAviso: todos los teléfonos son placeholders y no reciben WhatsApp." +
        "\nDefine SEED_OTP_PHONE en .env para probar el login real.",
    );
  } else if (soloUno) {
    console.log(
      "\nTeléfono de pruebas aplicado solo a " +
        soloUno +
        ".\nQuita SEED_OTP_EMAIL para aplicarlo a los 10 y poder alternar de rol.",
    );
  } else {
    console.log(
      "\nTeléfono de pruebas aplicado a los 10 usuarios: se puede entrar con" +
        "\ncualquiera de los correos y el código llega al mismo WhatsApp.",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
