import "dotenv/config";
import { prisma } from "@/lib/prisma";

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
  { email: "hcardps@wantnget.com.co", nombres: "Harold", apellidos: "Cardoso", numeroIdentificacion: "00000011", rolCodigo: "LIDER", oficina: "NORTE", telefono: "+573022988434" },
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

/**
 * Derivado de `datos_semilla.asignacion_gestor_lider` (hojas Ventas y Metas),
 * salvo NORTE: se corrió a hcardps (usuario de pruebas) para poder entrar
 * como Líder y ver un equipo con datos reales.
 */
const ASIGNACIONES_GESTOR_LIDER = [
  { gestor: "dgonzalez@wantnget.com.co", lider: "hcardps@wantnget.com.co" },
  { gestor: "pjimenez@wantnget.com.co", lider: "hcardps@wantnget.com.co" },
  { gestor: "prubio@wantnget.com.co", lider: "ccaceres@wantnget.com.co" },
  { gestor: "sramirez@wantnget.com.co", lider: "ccaceres@wantnget.com.co" },
];

/** RN-14: en los datos de referencia cada Líder tiene una sola oficina. */
const OFICINAS_POR_LIDER = [
  { lider: "mmartinez@wantnget.com.co", oficinas: ["NORTE"] },
  { lider: "hcardps@wantnget.com.co", oficinas: ["NORTE"] },
  { lider: "ccaceres@wantnget.com.co", oficinas: ["SUR"] },
];

const ASOCIADOS = [
  { identificacion: "90000001", nombre: "Carlos Ramírez", oficina: "NORTE" },
  { identificacion: "90000002", nombre: "Luisa Gómez", oficina: "NORTE" },
  { identificacion: "90000003", nombre: "Jorge Torres", oficina: "SUR" },
  { identificacion: "90000004", nombre: "Marcela Duarte", oficina: "SUR" },
] as const;

type ProductoDemo = {
  codigo: (typeof PRODUCTOS)[number]["codigo"];
  ventaCantidad?: number;
  ventaMonto?: number;
  presupuestoCantidad?: number;
  presupuestoMonto?: number;
};

/**
 * Números de venta y presupuesto por producto, para que Consulta General
 * (Resultados Comerciales/Embudo) tenga algo que mostrar. `ventaCantidad` y
 * `presupuestoCantidad` aplican a productos UNIDADES; `*Monto` a MONTO.
 */
const PRODUCTOS_DEMO: ProductoDemo[] = [
  { codigo: "AFILIACION", ventaCantidad: 7, presupuestoCantidad: 14 },
  { codigo: "COLOCACION", ventaMonto: 17_000_000, presupuestoMonto: 79_000_000 },
  { codigo: "CUENTA_AHORRO", ventaCantidad: 8, presupuestoCantidad: 15 },
  { codigo: "AHORRO_PROGRAMADO", ventaCantidad: 4, presupuestoCantidad: 11 },
  { codigo: "CDAT", ventaMonto: 2_500_000, presupuestoMonto: 13_900_000 },
  { codigo: "SEGUROS", ventaCantidad: 6, presupuestoCantidad: 8 },
  { codigo: "SERVICIOS", ventaCantidad: 9, presupuestoCantidad: 9 },
];

/** Una oportunidad en cada etapa del embudo, por producto. */
const ETAPAS_DEMO = [
  { estado: "PROSPECCION", etapa: "CONTACTO", resultadoCierre: null },
  { estado: "PROSPECCION", etapa: "OFERTA", resultadoCierre: null },
  { estado: "PROSPECCION", etapa: "OFERTA", resultadoCierre: null },
  { estado: "CERRADO", etapa: "CIERRE", resultadoCierre: "VENTA" },
  { estado: "CERRADO", etapa: "CIERRE", resultadoCierre: "NO_VENTA" },
] as const;

function periodoActual(): string {
  // America/Bogota es UTC-5 fijo, igual que en periodoVigenteDb (page-header.tsx).
  const local = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const mes = String(local.getUTCMonth() + 1).padStart(2, "0");
  return `${local.getUTCFullYear()}-${mes}`;
}

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
      update: {
        telefonoWhatsapp: telefonoDe(usuario),
        rolCodigo: usuario.rolCodigo,
        companiaId: compania.id,
        oficinaId: usuario.oficina ? oficinas.get(usuario.oficina) : null,
      },
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

  // 7. Asociados de demostración, para tener a quién abrirles oportunidades.
  const asociados = new Map<string, string>();
  for (const asociado of ASOCIADOS) {
    const registro = await prisma.asociado.upsert({
      where: {
        companiaId_numeroIdentificacion: {
          companiaId: compania.id,
          numeroIdentificacion: asociado.identificacion,
        },
      },
      update: { nombreCompleto: asociado.nombre, oficinaId: oficinas.get(asociado.oficina)! },
      create: {
        companiaId: compania.id,
        numeroIdentificacion: asociado.identificacion,
        nombreCompleto: asociado.nombre,
        oficinaId: oficinas.get(asociado.oficina)!,
        createdBy: adminGeneral.id,
      },
    });
    asociados.set(asociado.identificacion, registro.id);
  }

  const asociadosPorOficina = new Map<string, string[]>();
  for (const asociado of ASOCIADOS) {
    const lista = asociadosPorOficina.get(asociado.oficina) ?? [];
    lista.push(asociados.get(asociado.identificacion)!);
    asociadosPorOficina.set(asociado.oficina, lista);
  }

  // 8. Oportunidades y metas de demostración, para que Consulta General tenga
  // números reales. La oportunidad no tiene llave de negocio para upsert, así
  // que se reemplazan en cada corrida; hoy nada más escribe en esta tabla
  // porque Prospección todavía no existe.
  const periodo = periodoActual();
  const gestoresDemo = USUARIOS.filter((usuario) => usuario.rolCodigo === "GESTOR");

  await prisma.oportunidad.deleteMany({ where: { companiaId: compania.id, periodo } });

  let totalOportunidades = 0;
  for (const [productoIndex, productoDemo] of PRODUCTOS_DEMO.entries()) {
    for (let i = 0; i < ETAPAS_DEMO.length; i++) {
      const paso = ETAPAS_DEMO[i];
      // Se corre el índice por producto para que la venta y la no-venta no
      // caigan siempre en el mismo gestor: así los filtros de Líder/Gestor
      // muestran números distintos entre sí en más de un producto.
      const gestor = gestoresDemo[(i + productoIndex) % gestoresDemo.length];
      const liderEmail = ASIGNACIONES_GESTOR_LIDER.find((a) => a.gestor === gestor.email)!.lider;
      const asociadosOficina = asociadosPorOficina.get(gestor.oficina!)!;
      const esVenta = paso.resultadoCierre === "VENTA";

      await prisma.oportunidad.create({
        data: {
          companiaId: compania.id,
          asociadoId: asociadosOficina[i % asociadosOficina.length],
          productoCodigo: productoDemo.codigo,
          gestorId: usuarios.get(gestor.email)!,
          liderId: usuarios.get(liderEmail)!,
          oficinaId: oficinas.get(gestor.oficina!)!,
          estado: paso.estado,
          etapa: paso.etapa,
          resultadoCierre: paso.resultadoCierre,
          cantidad: esVenta ? (productoDemo.ventaCantidad ?? null) : null,
          monto: esVenta ? (productoDemo.ventaMonto ?? null) : null,
          fechaApertura: new Date(),
          fechaCierre: paso.estado === "CERRADO" ? new Date() : null,
          periodo,
          createdBy: adminGeneral.id,
        },
      });
      totalOportunidades++;
    }

    for (const gestor of gestoresDemo) {
      const liderEmail = ASIGNACIONES_GESTOR_LIDER.find((a) => a.gestor === gestor.email)!.lider;

      await prisma.meta.upsert({
        where: {
          companiaId_periodo_usuarioId_productoCodigo: {
            companiaId: compania.id,
            periodo,
            usuarioId: usuarios.get(gestor.email)!,
            productoCodigo: productoDemo.codigo,
          },
        },
        update: {
          metaCantidad: productoDemo.presupuestoCantidad
            ? Math.round(productoDemo.presupuestoCantidad / gestoresDemo.length)
            : null,
          metaMonto: productoDemo.presupuestoMonto
            ? Math.round(productoDemo.presupuestoMonto / gestoresDemo.length)
            : null,
          liderId: usuarios.get(liderEmail)!,
        },
        create: {
          companiaId: compania.id,
          periodo,
          rolObjetivo: "GESTOR",
          usuarioId: usuarios.get(gestor.email)!,
          liderId: usuarios.get(liderEmail)!,
          productoCodigo: productoDemo.codigo,
          metaCantidad: productoDemo.presupuestoCantidad
            ? Math.round(productoDemo.presupuestoCantidad / gestoresDemo.length)
            : null,
          metaMonto: productoDemo.presupuestoMonto
            ? Math.round(productoDemo.presupuestoMonto / gestoresDemo.length)
            : null,
          createdBy: adminGeneral.id,
        },
      });
    }
  }

  console.log(
    `Datos comerciales (${periodo}): ${asociados.size} asociados, ${totalOportunidades} oportunidades, ${PRODUCTOS_DEMO.length * gestoresDemo.length} metas`,
  );

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
