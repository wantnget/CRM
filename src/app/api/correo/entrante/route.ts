import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

function emailDe(campo: string): string | null {
  const conAngulos = campo.match(/<([^>]+)>/);
  const bruto = (conAngulos?.[1] ?? campo).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bruto) ? bruto : null;
}

function messageIdDe(cabeceras: string): string | null {
  return cabeceras.match(/^Message-ID:\s*(.+)$/im)?.[1]?.trim().slice(0, 120) ?? null;
}

function autorizado(request: NextRequest): boolean {
  const esperado = process.env.SENDGRID_INBOUND_TOKEN;
  if (!esperado) return true;
  return request.nextUrl.searchParams.get("token") === esperado;
}

export async function POST(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const datos = await request.formData();
  const remitente = emailDe(String(datos.get("from") ?? ""));
  const asunto = String(datos.get("subject") ?? "").trim().slice(0, 200) || null;
  const cuerpo = String(datos.get("text") ?? "").trim();
  const mensajeExternoId = messageIdDe(String(datos.get("headers") ?? ""));

  if (!remitente || !cuerpo) {
    return NextResponse.json({ ok: true, ignorado: "sin remitente o cuerpo" });
  }

  const asociado = await prisma.asociado.findFirst({
    where: { email: { equals: remitente, mode: "insensitive" }, estado: "ACTIVO" },
    select: { id: true, companiaId: true },
  });
  if (!asociado) {
    console.warn(`[correo entrante] sin asociado para ${remitente}`);
    return NextResponse.json({ ok: true, ignorado: "asociado no encontrado" });
  }

  const seleccionOportunidad = { id: true, gestorId: true, etapa: true } as const;
  const ordenRecencia = [
    { fechaUltimaGestion: "desc" as const },
    { fechaApertura: "desc" as const },
  ];

  const oportunidad =
    (await prisma.oportunidad.findFirst({
      where: { asociadoId: asociado.id, companiaId: asociado.companiaId, estado: "PROSPECCION" },
      select: seleccionOportunidad,
      orderBy: ordenRecencia,
    })) ??
    (await prisma.oportunidad.findFirst({
      where: { asociadoId: asociado.id, companiaId: asociado.companiaId },
      select: seleccionOportunidad,
      orderBy: ordenRecencia,
    }));
  if (!oportunidad) {
    console.warn(`[correo entrante] sin oportunidad para asociado ${asociado.id}`);
    return NextResponse.json({ ok: true, ignorado: "sin oportunidad abierta" });
  }

  const canal = await prisma.canalComunicacion.findUnique({
    where: { codigo: "CORREO_ENTRADA" },
    select: { codigo: true, direccion: true },
  });

  const ahora = new Date();

  await prisma.$transaction(async (tx) => {
    const gestion = await tx.gestion.create({
      data: {
        companiaId: asociado.companiaId,
        oportunidadId: oportunidad.id,
        asociadoId: asociado.id,
        gestorId: oportunidad.gestorId,
        fechaHora: ahora,
        etapa: oportunidad.etapa,
        canalCodigo: canal?.codigo ?? null,
        direccion: canal?.direccion ?? "ENTRADA",
        asunto,
        observacion: cuerpo,
        mensajeExternoId,
        createdBy: oportunidad.gestorId,
      },
    });

    await tx.oportunidad.update({
      where: { id: oportunidad.id },
      data: { fechaUltimaGestion: ahora },
    });

    await registrarAuditoria(tx, {
      tabla: "gestion",
      registroId: gestion.id,
      operacion: "INSERT",
      usuarioId: null,
      companiaId: asociado.companiaId,
      valoresNuevos: {
        oportunidadId: gestion.oportunidadId,
        etapa: gestion.etapa,
        canalCodigo: gestion.canalCodigo,
        direccion: gestion.direccion,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
