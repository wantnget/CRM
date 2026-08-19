/**
 * Datos de demostración.
 *
 * Reemplaza al dataset derivado del Excel "Base de Datos Ventas y Pagos", que
 * traía nombres completos y cédulas de personas reales. Una demo desplegada se
 * le muestra a terceros, y esos datos no fueron recogidos para eso (Ley 1581 de
 * 2012), así que acá todo es ficticio: los nombres se arman por combinación y
 * las identificaciones van en un rango sintético que no corresponde a cédulas
 * emitidas.
 *
 * Dos diferencias más con el dataset anterior:
 *
 * - Los periodos se calculan sobre la fecha de ejecución, no sobre las fechas
 *   del Excel. Con el dataset viejo todo caía en 2026-08 y la Consulta —que
 *   filtra por periodo vigente— salía en cero a partir de septiembre.
 * - Hay ventas cerradas en los meses anteriores del mismo año, para que el
 *   "Acumulado" del selector de rango muestre más que el mes.
 *
 * La generación es determinista: el seed tiene que dar lo mismo en cada
 * corrida, así que no se usa Math.random.
 */

export const DOMINIO = "@wantnget.com.co";

export type VentaReferencia = {
  numeroIdentificacion: string;
  nombreAsociado: string;
  fecha: string;
  productoCodigo: string;
  valor: number | null;
  oficinaCodigo: string;
  estado: "CERRADO" | "PROSPECCION";
  etapa: "CONTACTO" | "OFERTA" | "CIERRE";
  resultadoCierre: "VENTA" | "NO_VENTA" | null;
  gestor: string;
  lider: string;
};

export type MetaReferencia = {
  gestor: string;
  productoCodigo: string;
  periodo: string;
  meta: number;
};

export type AsociadoDemo = {
  numeroIdentificacion: string;
  nombreCompleto: string;
  oficinaCodigo: string;
  gestor: string;
};

// --------------------------------------------------------------- aleatorio

/**
 * Generador congruencial lineal. Da variedad sin depender de Math.random, que
 * haría que dos corridas del seed produjeran bases distintas.
 */
function secuencia(semilla: number) {
  let estado = semilla;
  return () => {
    estado = (estado * 1103515245 + 12345) % 2147483648;
    return estado / 2147483648;
  };
}

function entre(azar: () => number, min: number, max: number) {
  return min + Math.floor(azar() * (max - min + 1));
}

function uno<T>(azar: () => number, lista: readonly T[]): T {
  return lista[Math.floor(azar() * lista.length)];
}

// ---------------------------------------------------------------- periodos

/** Hoy en Bogotá: UTC-5 fijo, Colombia no aplica horario de verano. */
function hoyEnBogota() {
  return new Date(Date.now() - 5 * 60 * 60 * 1000);
}

const HOY = hoyEnBogota();
const ANIO = HOY.getUTCFullYear();
const MES = HOY.getUTCMonth() + 1;

function periodoDe(anio: number, mes: number) {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

/**
 * El mes en curso y hasta tres anteriores, sin salirse del año: el selector de
 * rango acumula por año, así que un mes de diciembre pasado desbalancearía la
 * comparación.
 */
const MESES_CON_DATOS = Array.from(
  { length: Math.min(4, MES) },
  (_, i) => MES - i,
).reverse();

export const PERIODOS = MESES_CON_DATOS.map((mes) => periodoDe(ANIO, mes));
export const PERIODO_ACTUAL = periodoDe(ANIO, MES);

/** Una fecha dentro del mes, sin pasarse de hoy si es el mes en curso. */
function fechaEn(mes: number, dia: number) {
  const ultimo = mes === MES ? Math.max(1, HOY.getUTCDate() - 1) : 28;
  const elegido = Math.min(dia, ultimo);
  return `${ANIO}-${String(mes).padStart(2, "0")}-${String(elegido).padStart(2, "0")}`;
}

// ------------------------------------------------------------------ equipo

/** Locales de correo de los Gestores; el seed les antepone DOMINIO. */
export const GESTORES = [
  { local: "gestor.norte1", lider: "lider.norte", oficina: "NORTE" },
  { local: "gestor.norte2", lider: "lider.norte", oficina: "NORTE" },
  { local: "gestor.sur1", lider: "lider.sur", oficina: "SUR" },
  { local: "gestor.sur2", lider: "lider.sur", oficina: "SUR" },
  // El Gestor de pruebas del equipo de desarrollo: su cartera incluye al
  // asociado que apunta al correo y al teléfono de quien prueba.
  { local: "prueba.gestor", lider: "prueba.lider", oficina: "SUR" },
] as const;

// ------------------------------------------------------------------ nombres

// Separados por género: al componer dos nombres de pila hay que tomarlos de
// la misma lista, o salen combinaciones como "Emilio Daniela".
const NOMBRES_M = [
  "Andrés", "Julián", "Santiago", "Sebastián", "Nicolás", "Felipe",
  "Mateo", "Emilio", "Tomás", "Martín", "Samuel", "Alejandro",
] as const;

const NOMBRES_F = [
  "Camila", "Valentina", "Mariana", "Daniela", "Laura", "Isabella",
  "Gabriela", "Salomé", "Antonia", "Luciana", "Renata", "Manuela",
] as const;

const APELLIDOS = [
  "Bermúdez", "Carvajal", "Delgadillo", "Espinal", "Fajardo", "Guzmán",
  "Hincapié", "Idárraga", "Jaramillo", "Lozano", "Montoya", "Nieto",
  "Ocampo", "Peláez", "Quintero", "Rivas", "Salgado", "Tobón",
  "Urrego", "Valencia", "Zapata", "Betancur", "Cifuentes", "Duarte",
] as const;

// ---------------------------------------------------------------- productos

const PRODUCTOS = [
  { codigo: "AFILIACION", monto: false, min: 1, max: 4 },
  { codigo: "COLOCACION", monto: true, min: 1_500_000, max: 12_000_000 },
  { codigo: "CUENTA_AHORRO", monto: false, min: 1, max: 5 },
  { codigo: "AHORRO_PROGRAMADO", monto: false, min: 1, max: 4 },
  { codigo: "CDAT", monto: true, min: 500_000, max: 8_000_000 },
  { codigo: "SEGUROS", monto: false, min: 1, max: 3 },
  { codigo: "SERVICIOS", monto: false, min: 1, max: 6 },
] as const;

function valorDe(azar: () => number, codigo: string) {
  const producto = PRODUCTOS.find((p) => p.codigo === codigo)!;
  if (!producto.monto) return entre(azar, producto.min, producto.max);

  // Montos redondeados a la centena de mil: así se ven como cifras de negocio
  // y no como números generados.
  const bruto = entre(azar, producto.min, producto.max);
  return Math.round(bruto / 100_000) * 100_000;
}

// --------------------------------------------------------------- asociados

const CANTIDAD_ASOCIADOS = 60;

/**
 * Identificación sintética. Arranca en 99.000.000 y avanza de a saltos
 * irregulares para que no se lean como una secuencia, pero sigue siendo un
 * rango que no corresponde a cédulas reales.
 */
function identificacion(indice: number, azar: () => number) {
  return String(99_000_000 + indice * 7919 + entre(azar, 0, 600));
}

function construirAsociados(): AsociadoDemo[] {
  const azar = secuencia(20260819);
  const asociados: AsociadoDemo[] = [];

  for (let i = 0; i < CANTIDAD_ASOCIADOS; i++) {
    // Cada asociado pertenece a un solo Gestor: RN-32 lo asigna a una cartera,
    // y repartirlo entre varios produciría asignaciones contradictorias.
    const gestor = GESTORES[i % GESTORES.length];
    const pila = azar() < 0.5 ? NOMBRES_M : NOMBRES_F;
    const primero = uno(azar, pila);
    // Un segundo nombre solo a veces, y distinto del primero: dos nombres de
    // pila son comunes en Colombia, pero no universales.
    const segundo = azar() < 0.6 ? uno(azar, pila.filter((n) => n !== primero)) : null;
    const apellidos = `${uno(azar, APELLIDOS)} ${uno(azar, APELLIDOS)}`;
    const nombre = [primero, segundo, apellidos].filter(Boolean).join(" ");

    asociados.push({
      numeroIdentificacion: identificacion(i, azar),
      nombreCompleto: nombre,
      oficinaCodigo: gestor.oficina,
      gestor: gestor.local,
    });
  }

  return asociados;
}

export const ASOCIADOS: AsociadoDemo[] = construirAsociados();

/**
 * El asociado reservado para las pruebas de envío: es al que se le ponen el
 * teléfono y el correo de quien prueba, en vez de los del resto. Va en la
 * cartera del Gestor de pruebas para poder escribirle desde Prospección.
 */
export const ASOCIADO_PRUEBA = ASOCIADOS.find(
  (a) => a.gestor === "prueba.gestor",
)!;

// -------------------------------------------------------------- ventas

function construirVentas(): VentaReferencia[] {
  const azar = secuencia(881122);
  const ventas: VentaReferencia[] = [];

  // RN-40: no puede haber dos oportunidades abiertas para la misma pareja
  // asociado + producto. Las cerradas sí pueden repetirse.
  const abiertas = new Set<string>();

  const gestorDe = (local: string) => GESTORES.find((g) => g.local === local)!;

  for (const mes of MESES_CON_DATOS) {
    const esMesActual = mes === MES;

    for (const [indice, asociado] of ASOCIADOS.entries()) {
      // En los meses pasados solo participa parte de la cartera: si todos
      // vendieran todos los meses, el acumulado se vería plano.
      if (!esMesActual && azar() > 0.45) continue;

      const gestor = gestorDe(asociado.gestor);
      const producto = uno(azar, PRODUCTOS);
      const clave = `${asociado.numeroIdentificacion}|${producto.codigo}`;

      // Los meses anteriores quedan cerrados; el mes en curso reparte entre las
      // tres etapas para que el embudo tenga volumen en todas.
      const sorteo = azar();
      let estado: VentaReferencia["estado"] = "CERRADO";
      let etapa: VentaReferencia["etapa"] = "CIERRE";
      let resultadoCierre: VentaReferencia["resultadoCierre"] =
        sorteo > 0.28 ? "VENTA" : "NO_VENTA";

      if (esMesActual) {
        if (sorteo < 0.22) {
          estado = "PROSPECCION";
          etapa = "CONTACTO";
          resultadoCierre = null;
        } else if (sorteo < 0.5) {
          estado = "PROSPECCION";
          etapa = "OFERTA";
          resultadoCierre = null;
        } else {
          resultadoCierre = sorteo < 0.78 ? "VENTA" : "NO_VENTA";
        }
      }

      if (estado === "PROSPECCION") {
        if (abiertas.has(clave)) continue;
        abiertas.add(clave);
      }

      // En contacto todavía no hay valor: se diligencia al pasar a oferta.
      const valor = etapa === "CONTACTO" ? null : valorDe(azar, producto.codigo);

      ventas.push({
        numeroIdentificacion: asociado.numeroIdentificacion,
        nombreAsociado: asociado.nombreCompleto,
        fecha: fechaEn(mes, entre(azar, 2, 27)),
        productoCodigo: producto.codigo,
        valor,
        oficinaCodigo: asociado.oficinaCodigo,
        estado,
        etapa,
        resultadoCierre,
        gestor: gestor.local,
        lider: gestor.lider,
      });

      void indice;
    }
  }

  return ventas;
}

export const VENTAS: VentaReferencia[] = construirVentas();

// ---------------------------------------------------------------- metas

/**
 * Una meta por Gestor, producto y periodo. Se calculan por encima de lo
 * vendido, con holgura variable, para que el cumplimiento no dé siempre el
 * mismo número ni siempre por debajo del 100%.
 */
function construirMetas(): MetaReferencia[] {
  const azar = secuencia(553311);
  const metas: MetaReferencia[] = [];

  for (const periodo of PERIODOS) {
    for (const gestor of GESTORES) {
      for (const producto of PRODUCTOS) {
        const vendido = VENTAS.filter(
          (v) =>
            v.gestor === gestor.local &&
            v.productoCodigo === producto.codigo &&
            v.fecha.slice(0, 7) === periodo &&
            v.resultadoCierre === "VENTA",
        ).reduce((suma, v) => suma + (v.valor ?? 0), 0);

        // Entre el 80% y el 140% de lo vendido: unos productos quedan cumplidos
        // y otros no, que es lo que hace legible el tablero.
        const factor = 0.8 + azar() * 0.6;
        const base = vendido > 0 ? vendido * factor : null;

        const meta = producto.monto
          ? Math.max(1_000_000, Math.round((base ?? 3_000_000) / 100_000) * 100_000)
          : Math.max(1, Math.round(base ?? entre(azar, 2, 6)));

        metas.push({
          gestor: gestor.local,
          productoCodigo: producto.codigo,
          periodo,
          meta,
        });
      }
    }
  }

  return metas;
}

export const METAS: MetaReferencia[] = construirMetas();
