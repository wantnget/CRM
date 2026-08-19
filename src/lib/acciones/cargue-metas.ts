"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obtenerContextoUsuario } from "@/lib/contexto-usuario";
import { BASE_CRM } from "@/lib/navegacion";

type FilaCsv = {
  numeroFila: number;
  gestorEmail: string;
  productoCodigo: string;
  liderEmail: string;
  periodo: string;
  valor: number;
};

export type ResultadoCargue = {
  ok: boolean;
  filasTotales: number;
  filasOk: number;
  filasError: number;
  errores: string[];
};

const PERIODO_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const COLUMNAS_ESPERADAS = ["gestor", "producto", "lider", "mes", "meta"];

function quitarBom(texto: string) {
  return texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
}

function normalizarEncabezado(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Gestor, Producto y Líder se identifican por su llave estable en el sistema
 * (email de usuario / código de producto), no por el nombre visible: el
 * nombre puede repetirse o cambiar y el email/código no.
 */
function parsearCsv(contenido: string): { filas: FilaCsv[]; errorEncabezado: string | null } {
  const lineas = quitarBom(contenido)
    .split(/\r\n|\n|\r/)
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);

  if (lineas.length === 0) {
    return { filas: [], errorEncabezado: "El archivo está vacío." };
  }

  const encabezado = lineas[0].split(";").map(normalizarEncabezado);
  const indice = (columna: string) => encabezado.indexOf(columna);
  const indices = {
    gestor: indice("gestor"),
    producto: indice("producto"),
    lider: indice("lider"),
    mes: indice("mes"),
    meta: indice("meta"),
  };

  const faltantes = COLUMNAS_ESPERADAS.filter(
    (columna) => indices[columna as keyof typeof indices] === -1,
  );
  if (faltantes.length > 0) {
    return {
      filas: [],
      errorEncabezado: `Faltan columnas en el encabezado: ${faltantes.join(", ")}.`,
    };
  }

  const filas: FilaCsv[] = lineas.slice(1).map((linea, i) => {
    const campos = linea.split(";");
    const valorCrudo = (campos[indices.meta] ?? "").replace(/[^\d.,-]/g, "").replace(",", ".");

    return {
      numeroFila: i + 2,
      gestorEmail: (campos[indices.gestor] ?? "").trim().toLowerCase(),
      productoCodigo: (campos[indices.producto] ?? "").trim().toUpperCase(),
      liderEmail: (campos[indices.lider] ?? "").trim().toLowerCase(),
      periodo: (campos[indices.mes] ?? "").trim(),
      valor: Number.parseFloat(valorCrudo),
    };
  });

  return { filas, errorEncabezado: null };
}

export async function cargarMetas(
  _previo: ResultadoCargue | null,
  formData: FormData,
): Promise<ResultadoCargue> {
  const contexto = await obtenerContextoUsuario();
  if (!contexto || !contexto.compania) {
    return { ok: false, filasTotales: 0, filasOk: 0, filasError: 0, errores: ["Sesión inválida."] };
  }

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return {
      ok: false,
      filasTotales: 0,
      filasOk: 0,
      filasError: 0,
      errores: ["Selecciona un archivo CSV."],
    };
  }

  const companiaId = contexto.compania.id;
  const { filas, errorEncabezado } = parsearCsv(await archivo.text());

  if (errorEncabezado) {
    return { ok: false, filasTotales: 0, filasOk: 0, filasError: 0, errores: [errorEncabezado] };
  }

  if (filas.length === 0) {
    return {
      ok: false,
      filasTotales: 0,
      filasOk: 0,
      filasError: 0,
      errores: ["El archivo no tiene filas de datos."],
    };
  }

  const [gestores, lideres, productos] = await Promise.all([
    prisma.usuario.findMany({
      where: { companiaId, rolCodigo: "GESTOR", estado: "ACTIVO" },
      select: { id: true, email: true },
    }),
    prisma.usuario.findMany({
      where: { companiaId, rolCodigo: "LIDER", estado: "ACTIVO" },
      select: { id: true, email: true },
    }),
    prisma.producto.findMany({ where: { activo: true }, select: { codigo: true, unidadMedida: true } }),
  ]);

  const gestorPorEmail = new Map(gestores.map((g) => [g.email.toLowerCase(), g.id]));
  const liderPorEmail = new Map(lideres.map((l) => [l.email.toLowerCase(), l.id]));
  const productoPorCodigo = new Map(productos.map((p) => [p.codigo, p.unidadMedida]));

  const periodoCargue = filas[0].periodo;
  const errores: string[] = [];
  const vistos = new Set<string>();

  type FilaValida = {
    gestorId: string;
    liderId: string;
    productoCodigo: string;
    cantidad: number | null;
    monto: number | null;
  };
  const validas: FilaValida[] = [];

  for (const fila of filas) {
    const prefijo = `Fila ${fila.numeroFila}:`;

    if (!fila.gestorEmail || !fila.productoCodigo || !fila.liderEmail || !fila.periodo || Number.isNaN(fila.valor)) {
      errores.push(`${prefijo} faltan columnas o el valor de Meta no es numérico.`);
      continue;
    }
    if (!PERIODO_REGEX.test(fila.periodo)) {
      errores.push(`${prefijo} el mes "${fila.periodo}" no tiene formato YYYY-MM.`);
      continue;
    }
    if (fila.periodo !== periodoCargue) {
      errores.push(`${prefijo} el mes no coincide con el del resto del archivo (${periodoCargue}).`);
      continue;
    }
    if (fila.valor <= 0) {
      errores.push(`${prefijo} la Meta debe ser un número mayor que cero.`);
      continue;
    }

    const gestorId = gestorPorEmail.get(fila.gestorEmail);
    if (!gestorId) {
      errores.push(`${prefijo} el Gestor "${fila.gestorEmail}" no existe o no está activo.`);
      continue;
    }
    const liderId = liderPorEmail.get(fila.liderEmail);
    if (!liderId) {
      errores.push(`${prefijo} el Líder "${fila.liderEmail}" no existe o no está activo.`);
      continue;
    }
    const unidadMedida = productoPorCodigo.get(fila.productoCodigo);
    if (!unidadMedida) {
      errores.push(`${prefijo} el Producto "${fila.productoCodigo}" no existe.`);
      continue;
    }

    const llave = `${fila.gestorEmail}|${fila.productoCodigo}`;
    if (vistos.has(llave)) {
      errores.push(`${prefijo} fila duplicada para el mismo Gestor y Producto.`);
      continue;
    }
    vistos.add(llave);

    validas.push({
      gestorId,
      liderId,
      productoCodigo: fila.productoCodigo,
      cantidad: unidadMedida === "UNIDADES" ? Math.round(fila.valor) : null,
      monto: unidadMedida === "MONTO" ? fila.valor : null,
    });
  }

  const iniciadoAt = new Date();

  await prisma.$transaction(async (tx) => {
    if (validas.length > 0) {
      await tx.meta.deleteMany({ where: { companiaId, periodo: periodoCargue } });
      await tx.meta.createMany({
        data: validas.map((fila) => ({
          companiaId,
          periodo: periodoCargue,
          rolObjetivo: "GESTOR",
          usuarioId: fila.gestorId,
          liderId: fila.liderId,
          productoCodigo: fila.productoCodigo,
          metaCantidad: fila.cantidad,
          metaMonto: fila.monto,
          createdBy: contexto.usuario.id,
        })),
      });
    }

    await tx.cargueArchivo.create({
      data: {
        companiaId,
        tipo: "METAS",
        usuarioId: contexto.usuario.id,
        nombreArchivo: archivo.name,
        periodo: periodoCargue,
        filasTotales: filas.length,
        filasOk: validas.length,
        filasError: errores.length,
        estado: errores.length > 0 ? "PROCESADO_CON_ERRORES" : "PROCESADO",
        logErrores: errores.length > 0 ? errores : undefined,
        iniciadoAt,
        finalizadoAt: new Date(),
      },
    });
  });

  revalidatePath(`${BASE_CRM}/metas`);

  return {
    ok: validas.length > 0,
    filasTotales: filas.length,
    filasOk: validas.length,
    filasError: errores.length,
    errores,
  };
}
