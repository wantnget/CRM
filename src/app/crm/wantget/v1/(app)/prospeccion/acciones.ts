"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  NO_AUTORIZADO,
  erroresDeZod,
  exigirGestor,
  type ContextoGestor,
} from "@/lib/acciones/gestor";
import { mapearDuplicado } from "@/lib/errores-prisma";
import { BASE_CRM } from "@/lib/navegacion";
import type { ResultadoAccion } from "@/lib/validaciones/usuario";
import {
  esquemaCambiarEtapa,
  esquemaCerrarProspeccion,
  esquemaNuevaProspeccion,
  esquemaRegistrarGestion,
} from "@/lib/validaciones/prospeccion";

/**
 * Server actions de Prospección (CRM.docx §7.3).
 *
 * El alcance es el del propio Gestor: la action revalida el rol y filtra por
 * `gestorId`, así que ni siquiera puede tocar una oportunidad de otro gestor de
 * la misma compañía.
 */

const RUTA = `${BASE_CRM}/prospeccion`;

/**
 * Periodo 'YYYY-MM' de una fecha en Bogotá. Colombia es UTC-5 y no aplica
 * horario de verano, así que se calcula con ese corrimiento y no con el del
 * servidor.
 *
 * RN-42: el periodo sale de la apertura mientras la oportunidad está abierta, y
 * de la fecha de cierre cuando se cierra. Por eso recibe la fecha en vez de
 * mirar siempre el reloj.
 */
function periodoDe(fecha: Date): string {
  const local = new Date(fecha.getTime() - 5 * 60 * 60 * 1000);
  const mes = String(local.getUTCMonth() + 1).padStart(2, "0");
  return `${local.getUTCFullYear()}-${mes}`;
}

/**
 * Reparte un valor entre `cantidad` y `monto` según la unidad del producto, y
 * anula la otra columna. Es la regla ck_oportunidad_valor_por_unidad del spec,
 * que no se puede expresar como CHECK porque la unidad vive en otra tabla.
 */
function valorPorUnidad(valor: number | null, unidad: string) {
  if (valor === null) return { cantidad: null, monto: null };
  return unidad === "MONTO"
    ? { cantidad: null, monto: valor }
    : { cantidad: valor, monto: null };
}

/**
 * Un producto medido en UNIDADES no admite decimales: `cantidad` es integer.
 * Se rechaza en vez de redondear, porque redondear cambia en silencio lo que el
 * gestor escribió.
 */
function valorInvalido(valor: number | null, unidad: string): string | null {
  if (valor === null || unidad === "MONTO") return null;
  return Number.isInteger(valor) ? null : "La cantidad debe ser un número entero";
}

/** Campos de la oportunidad que necesitan las acciones del detalle. */
const SELECCION_EDICION = {
  id: true,
  asociadoId: true,
  productoCodigo: true,
  etapa: true,
  estado: true,
  cantidad: true,
  monto: true,
  resultadoCierre: true,
  producto: { select: { unidadMedida: true } },
  asociado: { select: { nombreCompleto: true, email: true, telefonoWhatsapp: true } },
} as const;

/**
 * Carga una oportunidad del gestor y rechaza las cerradas.
 *
 * El filtro por `gestorId` es lo que impide abrir la de otro gestor de la misma
 * compañía poniendo su id en la URL. RN-38: al cerrar queda de solo lectura, y
 * una NO_VENTA se retoma creando una oportunidad nueva (RN-41), nunca editando
 * la anterior.
 */
async function cargarEditable(ctx: ContextoGestor, oportunidadId: string) {
  const oportunidad = await prisma.oportunidad.findFirst({
    where: { id: oportunidadId, companiaId: ctx.companiaId, gestorId: ctx.gestorId },
    select: SELECCION_EDICION,
  });

  if (!oportunidad) {
    return {
      error: {
        ok: false as const,
        mensaje: "No encontramos esa prospección en tu bandeja.",
      },
    };
  }

  // Se mira la etapa además del estado: las 2 filas de INC-04 traen estado
  // PROSPECCION con etapa CIERRE, y no deben poder editarse.
  if (oportunidad.etapa === "CIERRE" || oportunidad.estado === "CERRADO") {
    return {
      error: {
        ok: false as const,
        mensaje:
          "La prospección está cerrada y no admite cambios. Para retomarla, abre una nueva.",
      },
    };
  }

  return { oportunidad };
}

/** Canal habilitado para el gestor (RN-17 / RN-44). */
async function canalHabilitado(gestorId: string, canalCodigo: string) {
  const fila = await prisma.usuarioCanal.findFirst({
    where: { usuarioId: gestorId, canalCodigo, habilitado: true },
    select: { canal: { select: { codigo: true, direccion: true } } },
  });
  return fila?.canal ?? null;
}

// ------------------------------------------------------------------ crear

/**
 * Abre una prospección: crea la oportunidad en etapa CONTACTO y su primera
 * gestión con el canal del primer contacto.
 *
 * Las dos van juntas a propósito. RN-46 exige al menos una gestión en etapa
 * CONTACTO antes de poder avanzar a OFERTA, así que la oportunidad nace ya en
 * condiciones de avanzar; y el canal que elige el formulario queda registrado
 * donde corresponde, que es la bitácora.
 */
export async function crearProspeccion(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirGestor();
  if (!ctx) return NO_AUTORIZADO;

  if (!ctx.oficinaId) {
    // ck_usuario_gestor_con_oficina lo impide, pero oportunidad.oficina_id es
    // NOT NULL y conviene un mensaje antes que un error de base.
    return {
      ok: false,
      mensaje: "Tu usuario no tiene oficina asignada. Avisa al administrador.",
    };
  }

  const parseo = esquemaNuevaProspeccion.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  // RN-32: el asociado tiene que estar asignado a este gestor y vigente.
  const asignacion = await prisma.asignacionAsociado.findFirst({
    where: {
      companiaId: ctx.companiaId,
      gestorId: ctx.gestorId,
      asociadoId: datos.asociadoId,
      vigente: true,
    },
    select: { asociadoId: true },
  });
  if (!asignacion) {
    return {
      ok: false,
      mensaje: "Ese asociado no está asignado a tu cartera.",
      errores: { asociadoId: "Selecciona un asociado de tu cartera" },
    };
  }

  const producto = await prisma.producto.findFirst({
    where: { codigo: datos.productoCodigo, activo: true },
    select: { codigo: true },
  });
  if (!producto) {
    return {
      ok: false,
      mensaje: "El producto seleccionado no está disponible.",
      errores: { productoCodigo: "Selecciona un producto activo" },
    };
  }

  // RN-17 / RN-18 / RN-44: el canal tiene que estar habilitado para el gestor.
  // Se revalida acá y no se confía en el formulario.
  const canal = await prisma.usuarioCanal.findFirst({
    where: {
      usuarioId: ctx.gestorId,
      canalCodigo: datos.canalCodigo,
      habilitado: true,
    },
    select: { canal: { select: { codigo: true, direccion: true } } },
  });
  if (!canal) {
    return {
      ok: false,
      mensaje: "Ese canal no está habilitado para tu usuario.",
      errores: { canalCodigo: "Selecciona un canal habilitado" },
    };
  }

  // RN-40: una sola oportunidad abierta por pareja asociado + producto. La base
  // lo garantiza con un índice único parcial; esto es para dar un mensaje claro
  // en vez de un error de restricción.
  const abierta = await prisma.oportunidad.findFirst({
    where: {
      asociadoId: datos.asociadoId,
      productoCodigo: datos.productoCodigo,
      estado: "PROSPECCION",
    },
    select: { id: true },
  });
  if (abierta) {
    return {
      ok: false,
      mensaje:
        "Ese asociado ya tiene una prospección abierta para este producto.",
      errores: { productoCodigo: "Ya hay una oportunidad abierta" },
    };
  }

  const ahora = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      // El líder vigente se congela en la oportunidad para que una futura
      // reasignación no altere los resultados históricos.
      const asignacionLider = await tx.asignacionGestorLider.findFirst({
        where: { gestorId: ctx.gestorId, vigenteHasta: null },
        select: { liderId: true },
      });
      if (!asignacionLider) {
        throw new Error("SIN_LIDER");
      }

      const oportunidad = await tx.oportunidad.create({
        data: {
          companiaId: ctx.companiaId,
          asociadoId: datos.asociadoId,
          productoCodigo: datos.productoCodigo,
          gestorId: ctx.gestorId,
          liderId: asignacionLider.liderId,
          // La oficina es la del gestor: la atribución es sobre su resultado.
          oficinaId: ctx.oficinaId!,
          estado: "PROSPECCION",
          // RN-36: la prospección arranca en CONTACTO, no se saltan etapas.
          etapa: "CONTACTO",
          fechaApertura: ahora,
          fechaUltimaGestion: ahora,
          // RN-42: mientras está abierta, el periodo sale de la apertura.
          periodo: periodoDe(ahora),
          createdBy: ctx.gestorId,
        },
      });

      // RN-46: la primera gestión, en la misma etapa.
      const gestion = await tx.gestion.create({
        data: {
          companiaId: ctx.companiaId,
          oportunidadId: oportunidad.id,
          // Denormalizado para poder traer la historia del asociado sin
          // recorrer todas sus oportunidades.
          asociadoId: datos.asociadoId,
          gestorId: ctx.gestorId,
          fechaHora: ahora,
          etapa: "CONTACTO",
          canalCodigo: canal.canal.codigo,
          // Derivable del canal, se persiste para consultas.
          direccion: canal.canal.direccion,
          observacion: datos.observacion || null,
          createdBy: ctx.gestorId,
        },
      });

      await registrarAuditoria(tx, {
        tabla: "oportunidad",
        registroId: oportunidad.id,
        operacion: "INSERT",
        usuarioId: ctx.gestorId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresNuevos: {
          asociadoId: oportunidad.asociadoId,
          productoCodigo: oportunidad.productoCodigo,
          estado: oportunidad.estado,
          etapa: oportunidad.etapa,
          periodo: oportunidad.periodo,
          liderId: oportunidad.liderId,
          oficinaId: oportunidad.oficinaId,
        },
      });

      await registrarAuditoria(tx, {
        tabla: "gestion",
        registroId: gestion.id,
        operacion: "INSERT",
        usuarioId: ctx.gestorId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresNuevos: {
          oportunidadId: gestion.oportunidadId,
          etapa: gestion.etapa,
          canalCodigo: gestion.canalCodigo,
          direccion: gestion.direccion,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SIN_LIDER") {
      return {
        ok: false,
        mensaje:
          "Tu usuario no tiene un líder asignado. Avisa al administrador de la compañía.",
      };
    }

    const duplicado = mapearDuplicado<ResultadoAccion>(error, [
      [
        "ux_oportunidad_abierta_asociado_producto",
        {
          ok: false,
          mensaje:
            "Ese asociado ya tiene una prospección abierta para este producto.",
          errores: { productoCodigo: "Ya hay una oportunidad abierta" },
        },
      ],
      ["", { ok: false, mensaje: "El registro duplica un valor único." }],
    ]);
    if (duplicado) return duplicado;

    console.error("[crearProspeccion]", error);
    return { ok: false, mensaje: "No se pudo abrir la prospección." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

// ------------------------------------------------------- registrar gestión

/**
 * Registra una gestión en la bitácora del asociado (CRM.docx §7.3).
 *
 * Solo deja constancia: el canal indica por dónde ocurrió la interacción, no la
 * ejecuta. Enviar el correo o el WhatsApp de verdad se hace desde el módulo de
 * Comunicación, que tiene el estado de la conversación con el proveedor.
 *
 * La etapa que llega es la de la gestión, no la de la oportunidad: mover la
 * prospección de etapa es `cambiarEtapa`. Se separan porque `gestion.etapa` es
 * "la etapa en la que se realizó esta gestión", y mezclarlas haría que anotar
 * una llamada moviera el embudo sin que nadie lo pidiera.
 *
 * RN-43: la gestión es inmutable; no hay editar ni borrar. Una corrección se
 * registra como otra gestión.
 */
export async function registrarGestion(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirGestor();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaRegistrarGestion.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  const cargada = await cargarEditable(ctx, datos.oportunidadId);
  if (cargada.error) return cargada.error;
  const oportunidad = cargada.oportunidad;

  const canal = await canalHabilitado(ctx.gestorId, datos.canalCodigo);
  if (!canal) {
    return {
      ok: false,
      mensaje: "Ese canal no está habilitado para tu usuario.",
      errores: { canalCodigo: "Selecciona un canal habilitado" },
    };
  }

  const ahora = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const gestion = await tx.gestion.create({
        data: {
          companiaId: ctx.companiaId,
          oportunidadId: oportunidad.id,
          // Denormalizado para poder traer la historia del asociado sin
          // recorrer todas sus oportunidades.
          asociadoId: oportunidad.asociadoId,
          gestorId: ctx.gestorId,
          fechaHora: ahora,
          etapa: datos.etapa,
          canalCodigo: canal.codigo,
          // Derivable del canal, se persiste para consultas.
          direccion: canal.direccion,
          observacion: datos.observacion,
          createdBy: ctx.gestorId,
        },
      });

      // RN-45: la gestión mueve la fecha de última gestión de la oportunidad,
      // que es por lo que ordena la bandeja.
      await tx.oportunidad.update({
        where: { id: oportunidad.id },
        data: { fechaUltimaGestion: ahora, updatedBy: ctx.gestorId },
      });

      await registrarAuditoria(tx, {
        tabla: "gestion",
        registroId: gestion.id,
        operacion: "INSERT",
        usuarioId: ctx.gestorId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresNuevos: {
          oportunidadId: gestion.oportunidadId,
          etapa: gestion.etapa,
          canalCodigo: gestion.canalCodigo,
          direccion: gestion.direccion,
        },
      });
    });
  } catch (error) {
    console.error("[registrarGestion]", error);
    return { ok: false, mensaje: "No se pudo registrar la gestión." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

// ------------------------------------------------------------ cambiar etapa

/**
 * Mueve la prospección entre Contacto y Oferta, y corrige el valor ofertado.
 *
 * Las dos cosas van en la misma acción porque escriben las mismas columnas: al
 * pasar a Oferta hay que fijar el valor, y corregirlo después es la misma
 * escritura con la etapa quieta.
 *
 * RN-36 dice que las etapas son "estrictamente secuenciales" y que "no se
 * permite saltar ni retroceder". El prototipo sí permite retroceder, y por
 * ahora se respeta el prototipo: queda pendiente de confirmar con negocio. Si
 * se confirma RN-36, basta rechazar acá el paso de OFERTA a CONTACTO.
 *
 * A CIERRE no se llega por acá: el cierre exige un resultado y es irreversible
 * (RN-38), así que tiene su propia acción.
 */
export async function cambiarEtapa(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirGestor();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaCambiarEtapa.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  const cargada = await cargarEditable(ctx, datos.oportunidadId);
  if (cargada.error) return cargada.error;
  const oportunidad = cargada.oportunidad;

  const unidad = oportunidad.producto.unidadMedida;
  const valorActual =
    unidad === "MONTO"
      ? oportunidad.monto === null
        ? null
        : Number(oportunidad.monto)
      : oportunidad.cantidad;

  // Sin cambio de etapa ni de valor no hay nada que guardar, y una fila de
  // auditoría que no registra ningún cambio es ruido.
  if (
    oportunidad.etapa === datos.etapa &&
    (datos.valor === null || datos.valor === valorActual)
  ) {
    return { ok: false, mensaje: "No hay ningún cambio por guardar." };
  }

  if (datos.etapa === "OFERTA") {
    // RN-46: no se puede ofertar sin haber registrado al menos una gestión de
    // contacto. El alta ya crea una, así que solo falla si alguien borró filas.
    const contactos = await prisma.gestion.count({
      where: { oportunidadId: oportunidad.id, etapa: "CONTACTO" },
    });
    if (contactos === 0) {
      return {
        ok: false,
        mensaje:
          "Registra al menos una gestión en etapa Contacto antes de pasar a Oferta.",
      };
    }

    if (datos.valor === null) {
      return {
        ok: false,
        mensaje: "Indica el valor de la oferta.",
        errores: {
          valor:
            unidad === "MONTO"
              ? "Indica el monto ofertado"
              : "Indica la cantidad ofertada",
        },
      };
    }
  }

  const invalido = valorInvalido(datos.valor, unidad);
  if (invalido) {
    return { ok: false, mensaje: invalido, errores: { valor: invalido } };
  }

  // Al volver a Contacto se conserva lo ya diligenciado: la oferta existió y
  // borrarla perdería información que nadie pidió borrar.
  const valores =
    datos.valor === null ? {} : valorPorUnidad(datos.valor, unidad);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.oportunidad.update({
        where: { id: oportunidad.id },
        data: { etapa: datos.etapa, ...valores, updatedBy: ctx.gestorId },
      });

      await registrarAuditoria(tx, {
        tabla: "oportunidad",
        registroId: oportunidad.id,
        operacion: "UPDATE",
        usuarioId: ctx.gestorId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresAnteriores: {
          etapa: oportunidad.etapa,
          cantidad: oportunidad.cantidad,
          monto: oportunidad.monto === null ? null : Number(oportunidad.monto),
        },
        valoresNuevos: { etapa: datos.etapa, ...valores },
      });
    });
  } catch (error) {
    console.error("[cambiarEtapa]", error);
    return { ok: false, mensaje: "No se pudo cambiar la etapa." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}

// ------------------------------------------------------------------ cerrar

/**
 * Cierra la prospección como Finaliza – Venta o Finaliza – No Venta (RN-37).
 *
 * Es irreversible: RN-38 deja la oportunidad de solo lectura y RN-41 dice que
 * una NO_VENTA se retoma creando una oportunidad nueva, nunca editando esta.
 *
 * Con resultado VENTA el valor es obligatorio, porque es lo único que suma al
 * dashboard (RN-39). Se vuelve a pedir en vez de reusar el de la oferta porque
 * la negociación pudo cambiarlo.
 */
export async function cerrarProspeccion(
  entrada: unknown,
): Promise<ResultadoAccion> {
  const ctx = await exigirGestor();
  if (!ctx) return NO_AUTORIZADO;

  const parseo = esquemaCerrarProspeccion.safeParse(entrada);
  if (!parseo.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresDeZod(parseo.error),
    };
  }
  const datos = parseo.data;

  const cargada = await cargarEditable(ctx, datos.oportunidadId);
  if (cargada.error) return cargada.error;
  const oportunidad = cargada.oportunidad;

  const unidad = oportunidad.producto.unidadMedida;

  // El esquema ya lo exige; se repite acá porque es la regla que sostiene
  // ck_oportunidad_venta_con_valor y no debe depender de un solo punto.
  if (datos.resultado === "VENTA" && datos.valor === null) {
    return {
      ok: false,
      mensaje: "Confirma el valor de la venta.",
      errores: {
        valor:
          unidad === "MONTO"
            ? "Confirma el monto vendido"
            : "Confirma la cantidad vendida",
      },
    };
  }

  const invalido = valorInvalido(datos.valor, unidad);
  if (invalido) {
    return { ok: false, mensaje: invalido, errores: { valor: invalido } };
  }

  const ahora = new Date();

  // En NO_VENTA no se toca el valor: deja constancia de qué se llegó a ofertar.
  const valores =
    datos.resultado === "VENTA"
      ? valorPorUnidad(datos.valor, unidad)
      : {};

  try {
    await prisma.$transaction(async (tx) => {
      await tx.oportunidad.update({
        where: { id: oportunidad.id },
        data: {
          estado: "CERRADO",
          etapa: "CIERRE",
          resultadoCierre: datos.resultado,
          fechaCierre: ahora,
          // RN-42: cerrada, el periodo de imputación es el del cierre.
          periodo: periodoDe(ahora),
          ...valores,
          updatedBy: ctx.gestorId,
        },
      });

      await registrarAuditoria(tx, {
        tabla: "oportunidad",
        registroId: oportunidad.id,
        operacion: "UPDATE",
        usuarioId: ctx.gestorId,
        companiaId: ctx.companiaId,
        ip: ctx.ip,
        valoresAnteriores: {
          estado: oportunidad.estado,
          etapa: oportunidad.etapa,
          cantidad: oportunidad.cantidad,
          monto: oportunidad.monto === null ? null : Number(oportunidad.monto),
        },
        valoresNuevos: {
          estado: "CERRADO",
          etapa: "CIERRE",
          resultadoCierre: datos.resultado,
          periodo: periodoDe(ahora),
          ...valores,
        },
      });
    });
  } catch (error) {
    console.error("[cerrarProspeccion]", error);
    return { ok: false, mensaje: "No se pudo cerrar la prospección." };
  }

  revalidatePath(RUTA);
  return { ok: true };
}
