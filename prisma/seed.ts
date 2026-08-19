import "dotenv/config";
import type { DireccionComunicacion } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  ASOCIADOS,
  ASOCIADO_PRUEBA,
  DOMINIO,
  METAS,
  PERIODOS,
  VENTAS,
  type VentaReferencia,
} from "./datos-demo";

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
 *   SEED_OTP_PHONE                   tu número se aplica a todos los usuarios,
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
  { codigo: "LLAMADA", nombre: "Llamada", medio: "TELEFONO", direccion: "SALIDA", orden: 5 },
] as const;

const COMPANIA = { nit: "900100200", razonSocial: "Fondo Want" };

/**
 * A dónde llegan de verdad los mensajes de la demo.
 *
 * Todo lo que la aplicación envía —el código de acceso por WhatsApp, y los
 * mensajes, correos y llamadas que el Gestor dispara desde Prospección— sale
 * hacia un contacto real. En la demo ese contacto es uno solo, para que quien
 * la presenta reciba todo en su propio teléfono y correo.
 *
 * Aparte quedan los usuarios de prueba del equipo de desarrollo, con su propio
 * número, para poder trabajar sin interferir con la demo.
 */
const CONTACTO_DEMO = {
  telefono: "+573157427418",
  email: "dorjuela@wantnget.com.co",
};

const CONTACTO_PRUEBAS = {
  telefono: "+573145642627",
  email: "jjimenez@wantnget.com.co",
};

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
  email: `admin.general${DOMINIO}`,
  nombres: "Administrador",
  apellidos: "General",
  numeroIdentificacion: "90000001",
  rolCodigo: "ADMIN_GENERAL",
  oficina: null,
  telefono: CONTACTO_DEMO.telefono,
};

/**
 * Personal de la compañía de demostración. Nombres ficticios y correos que
 * dicen el rol, para que en la demo se vea con quién se está entrando.
 *
 * Todos comparten el teléfono de CONTACTO_DEMO: el código de acceso llega
 * siempre al mismo WhatsApp, así se puede alternar de rol cerrando sesión y
 * entrando con otro correo, sin tocar la base.
 */
/**
 * ADMIN_GENERAL del equipo de desarrollo. Va aparte de USUARIOS porque
 * ck_usuario_admin_general_sin_compania exige que el rol no tenga compañía, y
 * todo lo de USUARIOS se crea dentro de Fondo Want.
 */
const ADMIN_GENERAL_PRUEBAS: SeedUsuario = {
  email: `prueba.admin.general${DOMINIO}`,
  nombres: "Pruebas",
  apellidos: "Admin General",
  numeroIdentificacion: "91000001",
  rolCodigo: "ADMIN_GENERAL",
  oficina: null,
  telefono: CONTACTO_PRUEBAS.telefono,
};

const USUARIOS: SeedUsuario[] = [
  { email: `admin.compania${DOMINIO}`, nombres: "Adriana", apellidos: "Bermúdez", numeroIdentificacion: "90000002", rolCodigo: "ADMIN_COMPANIA", oficina: null, telefono: CONTACTO_DEMO.telefono },
  { email: `director${DOMINIO}`, nombres: "Ricardo", apellidos: "Salgado", numeroIdentificacion: "90000003", rolCodigo: "DIRECTOR", oficina: null, telefono: CONTACTO_DEMO.telefono },
  { email: `lider.norte${DOMINIO}`, nombres: "Marcela", apellidos: "Ocampo", numeroIdentificacion: "90000004", rolCodigo: "LIDER", oficina: "NORTE", telefono: CONTACTO_DEMO.telefono },
  { email: `lider.sur${DOMINIO}`, nombres: "Esteban", apellidos: "Quintero", numeroIdentificacion: "90000005", rolCodigo: "LIDER", oficina: "SUR", telefono: CONTACTO_DEMO.telefono },
  { email: `gestor.norte1${DOMINIO}`, nombres: "Carolina", apellidos: "Hincapié", numeroIdentificacion: "90000006", rolCodigo: "GESTOR", oficina: "NORTE", telefono: CONTACTO_DEMO.telefono, canales: { WA_SALIDA: true, WA_ENTRADA: true, CORREO_SALIDA: true, CORREO_ENTRADA: true, LLAMADA: true } },
  { email: `gestor.norte2${DOMINIO}`, nombres: "Javier", apellidos: "Montoya", numeroIdentificacion: "90000007", rolCodigo: "GESTOR", oficina: "NORTE", telefono: CONTACTO_DEMO.telefono, canales: { WA_SALIDA: true, WA_ENTRADA: true, CORREO_SALIDA: false, CORREO_ENTRADA: true, LLAMADA: false } },
  { email: `gestor.sur1${DOMINIO}`, nombres: "Natalia", apellidos: "Tobón", numeroIdentificacion: "90000008", rolCodigo: "GESTOR", oficina: "SUR", telefono: CONTACTO_DEMO.telefono, canales: { WA_SALIDA: true, WA_ENTRADA: true, CORREO_SALIDA: true, CORREO_ENTRADA: true, LLAMADA: true } },
  { email: `gestor.sur2${DOMINIO}`, nombres: "Iván", apellidos: "Urrego", numeroIdentificacion: "90000009", rolCodigo: "GESTOR", oficina: "SUR", telefono: CONTACTO_DEMO.telefono, canales: { WA_SALIDA: false, WA_ENTRADA: true, CORREO_SALIDA: true, CORREO_ENTRADA: true, LLAMADA: false } },

  // Usuarios del equipo de desarrollo: uno por rol, con el teléfono de
  // CONTACTO_PRUEBAS. Sirven para probar sin que los códigos ni los mensajes
  // caigan en el teléfono de quien está presentando la demo.
  { email: `prueba.admin.compania${DOMINIO}`, nombres: "Pruebas", apellidos: "Admin Compañía", numeroIdentificacion: "91000002", rolCodigo: "ADMIN_COMPANIA", oficina: null, telefono: CONTACTO_PRUEBAS.telefono },
  { email: `prueba.director${DOMINIO}`, nombres: "Pruebas", apellidos: "Director", numeroIdentificacion: "91000003", rolCodigo: "DIRECTOR", oficina: null, telefono: CONTACTO_PRUEBAS.telefono },
  { email: `prueba.lider${DOMINIO}`, nombres: "Pruebas", apellidos: "Líder", numeroIdentificacion: "91000004", rolCodigo: "LIDER", oficina: "SUR", telefono: CONTACTO_PRUEBAS.telefono },
  { email: `prueba.gestor${DOMINIO}`, nombres: "Pruebas", apellidos: "Gestor", numeroIdentificacion: "91000005", rolCodigo: "GESTOR", oficina: "SUR", telefono: CONTACTO_PRUEBAS.telefono, canales: { WA_SALIDA: true, WA_ENTRADA: true, CORREO_SALIDA: true, CORREO_ENTRADA: true, LLAMADA: true } },
  // PA-01: el rol CONSULTA no tiene flujo definido en el spec, así que entra a
  // una pantalla que lo explica. Se incluye para poder verificar justamente eso.
  { email: `prueba.consulta${DOMINIO}`, nombres: "Pruebas", apellidos: "Consulta", numeroIdentificacion: "91000006", rolCodigo: "CONSULTA", oficina: null, telefono: CONTACTO_PRUEBAS.telefono },
];

/**
 * Derivado de `datos_semilla.asignacion_gestor_lider` (hojas Ventas y Metas),
 * salvo NORTE: se corrió a hcardps (usuario de pruebas) para poder entrar
 * como Líder y ver un equipo con datos reales.
 */
const ASIGNACIONES_GESTOR_LIDER = [
  { gestor: `gestor.norte1${DOMINIO}`, lider: `lider.norte${DOMINIO}` },
  { gestor: `gestor.norte2${DOMINIO}`, lider: `lider.norte${DOMINIO}` },
  { gestor: `gestor.sur1${DOMINIO}`, lider: `lider.sur${DOMINIO}` },
  { gestor: `gestor.sur2${DOMINIO}`, lider: `lider.sur${DOMINIO}` },
  { gestor: `prueba.gestor${DOMINIO}`, lider: `prueba.lider${DOMINIO}` },
];

/** RN-14: en los datos de referencia cada Líder tiene una sola oficina. */
const OFICINAS_POR_LIDER = [
  { lider: `lider.norte${DOMINIO}`, oficinas: ["NORTE"] },
  { lider: `lider.sur${DOMINIO}`, oficinas: ["SUR"] },
  { lider: `prueba.lider${DOMINIO}`, oficinas: ["SUR"] },
];

// El dataset sintético de la rama de Director (4 asociados y una oportunidad
// por etapa y producto) se retiró: seedComercial() carga los 56 registros
// reales de la hoja Ventas, con sus 28 metas y 5 gestores, que es más de lo que
// aquel cubría. Además duplicaba parejas asociado + producto abiertas, que el
// índice ux_oportunidad_abierta_asociado_producto (RN-40) ya no admite.

/**
 * Override puntual del teléfono de un usuario, para desarrollo local.
 *
 * Exige las dos variables. Antes, con solo SEED_OTP_PHONE, el número se
 * aplicaba a todos los usuarios; eso ahora pisaría el reparto de la demo
 * —el teléfono de quien presenta en unos usuarios y el del equipo de
 * desarrollo en otros—, así que un SEED_OTP_PHONE suelto se ignora y avisa.
 */
function telefonoDe(usuario: SeedUsuario) {
  const overridePhone = process.env.SEED_OTP_PHONE;
  const overrideEmail = process.env.SEED_OTP_EMAIL?.toLowerCase();

  if (!overridePhone || !overrideEmail) return usuario.telefono;

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

  // 1. Asociados.
  //
  // El teléfono y el correo no son de los asociados ficticios: son el destino
  // real al que deben llegar los envíos de la demo. Cuando el Gestor manda un
  // WhatsApp, un correo o una llamada desde Prospección, la aplicación usa
  // estos campos, así que todo termina en el contacto de quien presenta.
  //
  // El único distinto es ASOCIADO_PRUEBA, que apunta al equipo de desarrollo
  // para poder probar envíos sin molestar a quien está en la demo.
  const asociados = new Map<string, string>();

  for (const asociado of ASOCIADOS) {
    const esDePrueba =
      asociado.numeroIdentificacion === ASOCIADO_PRUEBA.numeroIdentificacion;
    const contacto = esDePrueba ? CONTACTO_PRUEBAS : CONTACTO_DEMO;

    const registro = await prisma.asociado.upsert({
      where: {
        companiaId_numeroIdentificacion: {
          companiaId,
          numeroIdentificacion: asociado.numeroIdentificacion,
        },
      },
      update: {
        nombreCompleto: asociado.nombreCompleto,
        telefonoWhatsapp: contacto.telefono,
        email: contacto.email,
        oficinaId: oficinas.get(asociado.oficinaCodigo)!,
      },
      create: {
        companiaId,
        numeroIdentificacion: asociado.numeroIdentificacion,
        nombreCompleto: asociado.nombreCompleto,
        telefonoWhatsapp: contacto.telefono,
        email: contacto.email,
        oficinaId: oficinas.get(asociado.oficinaCodigo)!,
        origen: "CARGUE",
        createdBy: adminGeneralId,
      },
    });
    asociados.set(asociado.numeroIdentificacion, registro.id);
  }

  // 2. Oportunidades: una fila de la hoja Ventas es una oportunidad.
  //
  // Las gestiones se borran primero: apuntan a la oportunidad con RESTRICT, así
  // que en una re-corrida el delete de oportunidades falla si quedan.
  await prisma.gestion.deleteMany({ where: { companiaId } });
  await prisma.oportunidad.deleteMany({ where: { companiaId } });

  const valorDe = (venta: VentaReferencia) => {
    if (venta.valor === null) return { cantidad: null, monto: null };
    return unidad.get(venta.productoCodigo) === "MONTO"
      ? { cantidad: null, monto: venta.valor }
      : { cantidad: venta.valor, monto: null };
  };

  // Se guardan para derivar de ellas las gestiones del paso 5.
  const oportunidades: {
    id: string;
    asociadoId: string;
    gestorId: string;
    etapa: string;
    fecha: Date;
  }[] = [];

  for (const venta of VENTAS) {
    const fecha = new Date(`${venta.fecha}T12:00:00Z`);
    const cerrada = venta.etapa === "CIERRE";

    const creada = await prisma.oportunidad.create({
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
      select: { id: true, asociadoId: true, gestorId: true, etapa: true },
    });

    oportunidades.push({ ...creada, fecha });
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

  // 5. Gestiones.
  //
  // El Excel no trae la bitácora: la hoja Ventas es el resultado, no el proceso.
  // Sin gestiones la "Historia de gestiones del asociado" de CRM.docx §7.3 sale
  // vacía en las 56 prospecciones, así que se derivan de la etapa de cada una:
  // toda oportunidad tuvo un contacto (RN-46) y las que llegaron a oferta o a
  // cierre tuvieron además una gestión de oferta.
  //
  // Es dato de desarrollo, igual que las asignaciones del paso 4.
  const canalesPorGestor = new Map<string, { codigo: string; direccion: DireccionComunicacion }[]>();
  for (const gestor of new Set(oportunidades.map((o) => o.gestorId))) {
    const habilitados = await prisma.usuarioCanal.findMany({
      where: { usuarioId: gestor, habilitado: true },
      select: { canalCodigo: true, canal: { select: { direccion: true } } },
      orderBy: { canalCodigo: "asc" },
    });
    canalesPorGestor.set(
      gestor,
      habilitados.map((h) => ({ codigo: h.canalCodigo, direccion: h.canal.direccion })),
    );
  }

  const OBSERVACIONES = {
    CONTACTO: [
      "Primer contacto efectivo. El asociado manifiesta interés y pide detalle de condiciones.",
      "Sin respuesta en el primer intento. Se reprograma el contacto para el siguiente día hábil.",
      "Se validó el interés del asociado y se acordó enviar la propuesta.",
      "El asociado solicita ampliar el monto y revisar la cuota mensual. Se agenda seguimiento.",
    ],
    OFERTA: [
      "Se presentaron condiciones, plazo y beneficios. El asociado los revisa con su familia.",
      "Se validó capacidad de pago y documentos. Pendiente firma del formato de vinculación.",
      "El asociado acepta las condiciones presentadas y autoriza continuar con el trámite.",
      "Se ajustó la propuesta tras la negociación del plazo. A la espera de confirmación.",
    ],
  };

  let gestionesCreadas = 0;

  for (const [indice, oportunidad] of oportunidades.entries()) {
    const canales = canalesPorGestor.get(oportunidad.gestorId) ?? [];
    if (canales.length === 0) continue;

    // Las gestiones quedan antes de fecha_ultima_gestion de la oportunidad,
    // que es la fecha de la hoja Ventas, para no contradecirla.
    const etapas =
      oportunidad.etapa === "CONTACTO"
        ? (["CONTACTO"] as const)
        : (["CONTACTO", "OFERTA"] as const);

    for (const [orden, etapa] of etapas.entries()) {
      // Determinista a propósito: el seed tiene que ser reproducible.
      const canal = canales[(indice + orden) % canales.length];
      const textos = OBSERVACIONES[etapa];
      const dias = etapas.length - orden;

      const fechaHora = new Date(oportunidad.fecha);
      fechaHora.setUTCDate(fechaHora.getUTCDate() - dias);
      fechaHora.setUTCHours(14 + orden, 20 + indice % 30, 0, 0);

      await prisma.gestion.create({
        data: {
          companiaId,
          oportunidadId: oportunidad.id,
          asociadoId: oportunidad.asociadoId,
          gestorId: oportunidad.gestorId,
          fechaHora,
          etapa,
          canalCodigo: canal.codigo,
          direccion: canal.direccion,
          observacion: textos[(indice + orden) % textos.length],
          createdBy: oportunidad.gestorId,
        },
      });
      gestionesCreadas++;
    }
  }

  console.log(
    `Comercial: ${asociados.size} asociados, ${VENTAS.length} oportunidades, ` +
      `${METAS.length} metas, ${asignadas.size} asignaciones de asociado, ` +
      `${gestionesCreadas} gestiones`,
  );
  console.log(`Periodos con datos: ${PERIODOS.join(', ')}`);
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

  // El segundo ADMIN_GENERAL, para el equipo de desarrollo. Mismo trato: sin
  // compañía y con su propio teléfono.
  await prisma.usuario.upsert({
    where: { email: ADMIN_GENERAL_PRUEBAS.email },
    update: { telefonoWhatsapp: telefonoDe(ADMIN_GENERAL_PRUEBAS) },
    create: {
      email: ADMIN_GENERAL_PRUEBAS.email,
      nombres: ADMIN_GENERAL_PRUEBAS.nombres,
      apellidos: ADMIN_GENERAL_PRUEBAS.apellidos,
      numeroIdentificacion: ADMIN_GENERAL_PRUEBAS.numeroIdentificacion,
      telefonoWhatsapp: telefonoDe(ADMIN_GENERAL_PRUEBAS),
      rolCodigo: ADMIN_GENERAL_PRUEBAS.rolCodigo,
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
      `\nTeléfono de pruebas aplicado a los ${USUARIOS.length + 2} usuarios: se puede entrar con` +
        "\ncualquiera de los correos y el código llega al mismo WhatsApp.",
    );
  }

  console.log(
    `\nDemo: los códigos de acceso y los envíos de Prospección van a ` +
      `${CONTACTO_DEMO.telefono} y ${CONTACTO_DEMO.email}.` +
      `\nUsuarios prueba.* y el asociado ${ASOCIADO_PRUEBA.numeroIdentificacion} ` +
      `van a ${CONTACTO_PRUEBAS.telefono} y ${CONTACTO_PRUEBAS.email}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
